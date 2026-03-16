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
} from '@/types'

// ── Tool Ideas ──────────────────────────────────────

export type ToolIdea = RedditToolScore & {
  post: RedditPost
  latest_action: RedditToolAction | null
}

export function useToolIdeas() {
  const [ideas, setIdeas] = useState<ToolIdea[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchIdeas = useCallback(async () => {
    // Fetch scores with joined post data
    const { data: scores } = await supabase
      .from('reddit_tool_scores')
      .select('*, post:reddit_posts!post_id(*)')
      .order('composite_score', { ascending: false })
      .limit(100)

    if (!scores || !scores.length) { setLoading(false); return }

    // Fetch actions keyed by post_id
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
    const { error } = await supabase.from('reddit_tool_actions').insert({
      post_id: postId,
      action,
      notes: notes ?? null,
      acted_by: user?.id ?? null,
    })
    if (!error) await fetchIdeas()
    return !error
  }

  return { ideas, loading, actOnTool, refresh: fetchIdeas }
}

// ── Content Ideas ───────────────────────────────────

export type ContentIdea = RedditContentScore & {
  post: RedditPost
  latest_action: RedditContentAction | null
}

export function useContentIdeas() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
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
    const { error } = await supabase.from('reddit_content_actions').insert({
      post_id: postId,
      action,
      notes: notes ?? null,
      acted_by: user?.id ?? null,
    })
    if (!error) await fetchIdeas()
    return !error
  }

  return { ideas, loading, actOnContent, refresh: fetchIdeas }
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
