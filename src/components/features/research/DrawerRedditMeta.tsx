import type { RedditPost } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .format(new Date(iso))
  } catch { return iso }
}

type Props = {
  post: RedditPost
}

const META: Array<{ label: string; render: (p: RedditPost) => string }> = [
  { label: 'Subreddit', render: p => `r/${p.subreddit}` },
  { label: 'Author', render: p => `u/${p.author}` },
  { label: 'Upvotes', render: p => String(p.upvotes) },
  { label: 'Comments', render: p => String(p.num_comments) },
  { label: 'Posted', render: p => formatDate(p.published_at ?? p.collected_at) },
  { label: 'Fetched', render: p => formatDate(p.collected_at) },
]

export function DrawerRedditMeta({ post }: Props) {
  return (
    <Section title="Reddit metadata">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
        {META.map(m => (
          <div key={m.label} className="contents">
            <span className="text-slate-500">{m.label}</span>
            <span className="text-slate-900 tabular-nums">{m.render(post)}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
