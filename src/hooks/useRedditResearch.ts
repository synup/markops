'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  RedditPost,
  RedditToolScore,
  RedditContentScore,
  RedditToolAction,
  RedditContentAction,
  RedditFeedSource,
  RedditSubredditSuggestion,
  RedditAgentConfig,
} from '@/types'

// ── Helper: log feedback ────────────────────────────

async function logFeedback(supabase: ReturnType<typeof createClient>, params: {
  post_id: string
  agent_name: string
  feedback_type: string
  from_track?: string
  to_track?: string
  original_score?: number
  original_action?: string
  feedback_notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('reddit_feedback_log').insert({
    ...params,
    from_track: params.from_track ?? null,
    to_track: params.to_track ?? null,
    original_score: params.original_score ?? null,
    original_action: params.original_action ?? null,
    feedback_notes: params.feedback_notes ?? null,
    performed_by: user?.id ?? null,
  })
}

// ── Undo data type ──────────────────────────────────

export interface ReclassifyUndoData {
  postId: string
  scoreId: string
  fromTrack: 'tool' | 'content'
  toTrack: 'content' | 'tool'
  originalCategory: string | null
  scoreRow: Record<string, unknown>
}

// ── Score Request ───────────────────────────────────

export function useScoreRequest() {
  const [pending, setPending] = useState(false)
  const supabase = createClient()

  const requestScore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setPending(true)
    const { error } = await supabase.from('reddit_score_requests').insert({
      requested_by: user?.email ?? user?.id ?? 'unknown',
    })
    if (error) { setPending(false); return false }
    pollUntilDone()
    return true
  }

  const pollUntilDone = () => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('reddit_score_requests')
        .select('status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) {
        setPending(false)
        clearInterval(interval)
      }
    }, 5000)
    // Auto-stop after 5 minutes
    setTimeout(() => { clearInterval(interval); setPending(false) }, 300000)
  }

  return { pending, requestScore }
}

// ── Tool Ideas ──────────────────────────────────────

export type ToolIdea = RedditToolScore & {
  post: RedditPost
  latest_action: RedditToolAction | null
}

export function useToolIdeas() {
  const [ideas, setIdeas] = useState<ToolIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [undoData, setUndoData] = useState<ReclassifyUndoData | null>(null)
  const supabase = createClient()

  const fetchIdeas = useCallback(async () => {
    const { data: scores } = await supabase
      .from('reddit_tool_scores')
      .select('*, post:reddit_posts!post_id(*)')
      .order('composite_score', { ascending: false })
      .limit(100)

    if (!scores || !scores.length) { setLoading(false); return }

    const postIds = scores.map(s => s.post_id)
    const { data: actions } = await supabase
      .from('reddit_tool_actions')
      .select('*')
      .in('post_id', postIds)
      .order('acted_at', { ascending: false })

    const actionMap = new Map<string, RedditToolAction>()
    actions?.forEach(a => {
      if (!actionMap.has(a.post_id)) actionMap.set(a.post_id, a)
    })

    setIdeas(scores.map(s => ({
      ...s,
      post: s.post as RedditPost,
      latest_action: actionMap.get(s.post_id) ?? null,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  const actOnTool = async (postId: string, action: string, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const idea = ideas.find(i => i.post_id === postId)
    const { error } = await supabase.from('reddit_tool_actions').insert({
      post_id: postId,
      action,
      notes: notes ?? null,
      acted_by: user?.id ?? null,
    })
    if (!error) {
      await logFeedback(supabase, {
        post_id: postId,
        agent_name: 'tool_scorer',
        feedback_type: action,
        original_score: idea?.composite_score,
        original_action: idea?.action_rationale ?? undefined,
      })
      await fetchIdeas()
    }
    return !error
  }

  const reclassifyToContent = async (postId: string, scoreId: string) => {
    const idea = ideas.find(i => i.post_id === postId)
    if (!idea) return
    // Save score row for undo (strip the joined `post`)
    const { post: _post, latest_action: _action, ...scoreRow } = idea
    const originalCategory = idea.post.category
    await supabase.from('reddit_tool_scores').delete().eq('id', scoreId)
    await supabase.from('reddit_posts').update({ category: 'content_idea' }).eq('id', postId)
    await logFeedback(supabase, {
      post_id: postId, agent_name: 'tool_scorer', feedback_type: 'reclassified',
      from_track: 'tool', to_track: 'content', original_score: idea.composite_score,
    })
    setUndoData({ postId, scoreId, fromTrack: 'tool', toTrack: 'content', originalCategory, scoreRow })
    await fetchIdeas()
  }

  const undoReclassify = async () => {
    if (!undoData) return
    const { postId, scoreRow, originalCategory } = undoData
    await supabase.from('reddit_tool_scores').insert(scoreRow)
    await supabase.from('reddit_posts').update({ category: originalCategory }).eq('id', postId)
    await logFeedback(supabase, {
      post_id: postId, agent_name: 'tool_scorer', feedback_type: 'undo_reclassify',
      from_track: 'content', to_track: 'tool',
    })
    setUndoData(null)
    await fetchIdeas()
  }

  const clearUndo = useCallback(() => setUndoData(null), [])

  return { ideas, loading, actOnTool, reclassifyToContent, undoData, undoReclassify, clearUndo, refresh: fetchIdeas }
}

// ── Content Ideas ───────────────────────────────────

export type ContentIdea = RedditContentScore & {
  post: RedditPost
  latest_action: RedditContentAction | null
}

export function useContentIdeas() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [undoData, setUndoData] = useState<ReclassifyUndoData | null>(null)
  const supabase = createClient()

  const fetchIdeas = useCallback(async () => {
    const { data: scores } = await supabase
      .from('reddit_content_scores')
      .select('*, post:reddit_posts!post_id(*)')
      .order('composite_score', { ascending: false })
      .limit(100)

    if (!scores || !scores.length) { setLoading(false); return }

    const postIds = scores.map(s => s.post_id)
    const { data: actions } = await supabase
      .from('reddit_content_actions')
      .select('*')
      .in('post_id', postIds)
      .order('acted_at', { ascending: false })

    const actionMap = new Map<string, RedditContentAction>()
    actions?.forEach(a => {
      if (!actionMap.has(a.post_id)) actionMap.set(a.post_id, a)
    })

    setIdeas(scores.map(s => ({
      ...s,
      post: s.post as RedditPost,
      latest_action: actionMap.get(s.post_id) ?? null,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  const actOnContent = async (postId: string, action: string, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const idea = ideas.find(i => i.post_id === postId)
    const { error } = await supabase.from('reddit_content_actions').insert({
      post_id: postId,
      action,
      notes: notes ?? null,
      acted_by: user?.id ?? null,
    })
    if (!error) {
      await logFeedback(supabase, {
        post_id: postId,
        agent_name: 'content_validator',
        feedback_type: action,
        original_score: idea?.composite_score,
        original_action: idea?.action_rationale ?? undefined,
      })
      await fetchIdeas()
    }
    return !error
  }

  const reclassifyToTool = async (postId: string, scoreId: string) => {
    const idea = ideas.find(i => i.post_id === postId)
    if (!idea) return
    const { post: _post, latest_action: _action, ...scoreRow } = idea
    const originalCategory = idea.post.category
    await supabase.from('reddit_content_scores').delete().eq('id', scoreId)
    await supabase.from('reddit_posts').update({ category: 'tool_request' }).eq('id', postId)
    await logFeedback(supabase, {
      post_id: postId, agent_name: 'content_validator', feedback_type: 'reclassified',
      from_track: 'content', to_track: 'tool', original_score: idea.composite_score,
    })
    setUndoData({ postId, scoreId, fromTrack: 'content', toTrack: 'tool', originalCategory, scoreRow })
    await fetchIdeas()
  }

  const undoReclassify = async () => {
    if (!undoData) return
    const { postId, scoreRow, originalCategory } = undoData
    await supabase.from('reddit_content_scores').insert(scoreRow)
    await supabase.from('reddit_posts').update({ category: originalCategory }).eq('id', postId)
    await logFeedback(supabase, {
      post_id: postId, agent_name: 'content_validator', feedback_type: 'undo_reclassify',
      from_track: 'tool', to_track: 'content',
    })
    setUndoData(null)
    await fetchIdeas()
  }

  const clearUndo = useCallback(() => setUndoData(null), [])

  return { ideas, loading, actOnContent, reclassifyToTool, undoData, undoReclassify, clearUndo, refresh: fetchIdeas }
}

// ── Feed Sources ────────────────────────────────────

export function useFeedSources() {
  const [sources, setSources] = useState<RedditFeedSource[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSources = useCallback(async () => {
    const { data } = await supabase
      .from('reddit_feed_sources')
      .select('*')
      .order('feed_type')
      .order('value')
    setSources(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSources() }, [fetchSources])

  const addSource = async (feedType: 'subreddit' | 'keyword_search', value: string, label?: string, notes?: string) => {
    const { error } = await supabase.from('reddit_feed_sources').insert({
      feed_type: feedType,
      value,
      label: label || null,
      notes: notes || null,
    })
    if (!error) await fetchSources()
    return !error
  }

  const removeSource = async (id: string) => {
    const { error } = await supabase.from('reddit_feed_sources').delete().eq('id', id)
    if (!error) await fetchSources()
    return !error
  }

  const toggleSource = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from('reddit_feed_sources').update({ enabled }).eq('id', id)
    if (!error) {
      setSources(prev => prev.map(s => s.id === id ? { ...s, enabled } : s))
    }
    return !error
  }

  return { sources, loading, addSource, removeSource, toggleSource, refresh: fetchSources }
}

// ── Subreddit Suggestions ───────────────────────────

export function useSubredditSuggestions() {
  const [suggestions, setSuggestions] = useState<RedditSubredditSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSuggestions = useCallback(async () => {
    const { data } = await supabase
      .from('reddit_subreddit_suggestions')
      .select('*')
      .order('suggested_at', { ascending: false })
    setSuggestions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('reddit_subreddit_suggestions')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    }
    return !error
  }

  return { suggestions, loading, updateStatus, refresh: fetchSuggestions }
}

// ── Agent Configs ───────────────────────────────────

export function useAgentConfigs() {
  const [agents, setAgents] = useState<RedditAgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAgents = useCallback(async () => {
    const { data } = await supabase
      .from('reddit_agent_configs')
      .select('*')
      .order('agent_name')
    setAgents(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const updatePrompt = async (id: string, systemPrompt: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const agent = agents.find(a => a.id === id)
    if (!agent) return false
    const { error } = await supabase
      .from('reddit_agent_configs')
      .update({
        system_prompt: systemPrompt,
        version: agent.version + 1,
        updated_at: new Date().toISOString(),
        last_modified_by: user?.email ?? user?.id ?? null,
      })
      .eq('id', id)
    if (!error) {
      setAgents(prev => prev.map(a => a.id === id ? {
        ...a,
        system_prompt: systemPrompt,
        version: a.version + 1,
        updated_at: new Date().toISOString(),
      } : a))
    }
    return !error
  }

  const toggleAgent = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('reddit_agent_configs')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, enabled } : a))
    }
    return !error
  }

  return { agents, loading, updatePrompt, toggleAgent, refresh: fetchAgents }
}

// ── Feedback Summary ────────────────────────────────

export interface FeedbackEntry {
  id: string
  feedback_type: string
  post_id: string
  created_at: string
}

export interface FeedbackSummaryData {
  approvals: number
  rejections: number
  approvalRate: number
  recent: FeedbackEntry[]
}

export function useFeedbackSummary(agentName: string) {
  const [data, setData] = useState<FeedbackSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data: rows } = await supabase
        .from('reddit_feedback_log')
        .select('id, feedback_type, post_id, created_at')
        .eq('agent_name', agentName)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!rows) { setLoading(false); return }

      const approvals = rows.filter(r => r.feedback_type === 'approved').length
      const rejections = rows.filter(r => r.feedback_type === 'rejected').length
      const total = approvals + rejections
      setData({
        approvals,
        rejections,
        approvalRate: total > 0 ? Math.round((approvals / total) * 100) : 0,
        recent: rows.slice(0, 5),
      })
      setLoading(false)
    }
    fetch()
  }, [agentName])

  return { data, loading }
}

// ── Research Activity ───────────────────────────────

export interface ResearchAction {
  id: string
  type: 'tool' | 'content'
  action: string
  post_title: string
  acted_at: string
}

export function useResearchActivity() {
  const [actions, setActions] = useState<ResearchAction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const [{ data: toolActions }, { data: contentActions }] = await Promise.all([
        supabase
          .from('reddit_tool_actions')
          .select('id, action, acted_at, post:reddit_posts!post_id(title)')
          .order('acted_at', { ascending: false })
          .limit(25),
        supabase
          .from('reddit_content_actions')
          .select('id, action, acted_at, post:reddit_posts!post_id(title)')
          .order('acted_at', { ascending: false })
          .limit(25),
      ])

      const combined: ResearchAction[] = []

      toolActions?.forEach(a => {
        const post = a.post as unknown as { title: string } | null
        combined.push({
          id: `tool-${a.id}`,
          type: 'tool',
          action: a.action,
          post_title: post?.title ?? 'Unknown post',
          acted_at: a.acted_at,
        })
      })

      contentActions?.forEach(a => {
        const post = a.post as unknown as { title: string } | null
        combined.push({
          id: `content-${a.id}`,
          type: 'content',
          action: a.action,
          post_title: post?.title ?? 'Unknown post',
          acted_at: a.acted_at,
        })
      })

      combined.sort((a, b) => new Date(b.acted_at).getTime() - new Date(a.acted_at).getTime())
      setActions(combined.slice(0, 30))
      setLoading(false)
    }
    fetch()
  }, [])

  return { actions, loading }
}

// ── Research Stats ──────────────────────────────────

export interface ResearchStats {
  totalPosts: number
  toolIdeas: number
  contentIdeas: number
  approvedTools: number
  approvedContent: number
  feedSources: number
}

export function useResearchStats() {
  const [stats, setStats] = useState<ResearchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const [posts, tools, content, toolActs, contentActs, feeds] = await Promise.all([
        supabase.from('reddit_posts').select('id', { count: 'exact', head: true }),
        supabase.from('reddit_tool_scores').select('id', { count: 'exact', head: true }),
        supabase.from('reddit_content_scores').select('id', { count: 'exact', head: true }),
        supabase.from('reddit_tool_actions').select('id', { count: 'exact', head: true }).eq('action', 'approved'),
        supabase.from('reddit_content_actions').select('id', { count: 'exact', head: true }).eq('action', 'approved'),
        supabase.from('reddit_feed_sources').select('id', { count: 'exact', head: true }).eq('enabled', true),
      ])

      setStats({
        totalPosts: posts.count ?? 0,
        toolIdeas: tools.count ?? 0,
        contentIdeas: content.count ?? 0,
        approvedTools: toolActs.count ?? 0,
        approvedContent: contentActs.count ?? 0,
        feedSources: feeds.count ?? 0,
      })
      setLoading(false)
    }
    fetch()
  }, [])

  return { stats, loading }
}
