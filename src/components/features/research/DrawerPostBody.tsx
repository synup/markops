import type { RedditPost } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

type Props = {
  post: RedditPost
}

export function DrawerPostBody({ post }: Props) {
  return (
    <Section title="Post">
      {post.selftext ? (
        <p className="whitespace-pre-line text-[14px] leading-[1.65] text-slate-700">
          {post.selftext}
        </p>
      ) : (
        <p className="text-[13px] italic text-slate-400">
          (no body — link post or title only)
        </p>
      )}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[13px] text-cyan-700 hover:text-cyan-800"
      >
        Open in Reddit ↗
      </a>
    </Section>
  )
}
