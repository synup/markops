# Asset type: Tool

## Specs
- Format: interactive free tool, web-based
- Goal: solve a specific operational problem for the ICP, build organic traffic and lead capture surface
- Distribution surface: synup.dev (developer-leaning), free.synup.com, dedicated vercel subdomain, or synup.com (depending on audience)
- Reference: GBP Photo Analyzer at gbp-photo-analyzer.vercel.app — single-purpose, client-side, no signup. That is the bar for what a Synup tool looks like.

## Generate the brief in this exact structure

# {Working title}

## Tool concept
What the tool does in one specific sentence. The single utility it provides. Tools that do "many things" tend to do nothing well — define the one job.

## ICP
Which segment this serves and the specific scenario where they would use it.

## Utility gap
What gap in existing free tools this fills. The capability or workflow that operators currently lack a quick free utility for, in this audience's context. Be specific — "GBP analysis tool" is not a gap; "tool that checks all 70+ listing publishers in 30 seconds with no signup" is.

## MVP features
3-5 features the tool must have to deliver value, in priority order. Each specific and scoped — "lets users upload an image and get back an AI quality score" is a feature; "comprehensive image analysis" is not.

## Nice-to-haves (post-v1)
1-3 features that would improve the tool but are not v1-critical. Helps the builder know what to descope under time pressure.

## Technical approach
- Client-side vs server-side: does this run in-browser or need API calls? Privacy and friction implications.
- Data sources: external APIs, public datasets, Synup data, computed on the fly
- Complexity estimate: weekend project, 1-2 weeks, multi-week build
- Auth model: no signup (lowest friction), email gate, full account required
- Cost considerations: free perpetually, freemium upsell to paid Synup, or temporary loss-leader

## Source material
- Original conversation: Customer or prospect, meeting context
- The specific operational need that surfaced in that conversation
- Why this utility gap is likely shared across the ICP segment

## Distribution and positioning
- Primary surface: synup.dev (developer-facing), free.synup.com (operator-facing), specific vercel subdomain (standalone), or synup.com (core marketing site)
- Lead capture approach: how does the tool surface a path to Synup proper? (footer CTA, email-gated export, embedded "powered by Synup" branding)
- SEO target: what queries should this tool rank for

## Quick voice note
Tool copy is functional and direct. Headline states what the tool does. UI copy guides the user without preamble. Apply Niladri's voice rules and AI-pattern avoidance from the long-form templates.

## Guardrails
- Do not build the tool itself — only the brief
- MVP features must be scoped tight enough to ship in 2-4 weeks
- Privacy-by-default: if the tool processes user data, client-side processing is the default unless server-side is operationally required
- The tool must solve a real specific problem, not a general "analyzer" or "checker" that produces vague output
