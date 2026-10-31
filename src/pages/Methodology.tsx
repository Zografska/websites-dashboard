import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mdEn from '@/content/METHODOLOGY.md?raw'
import mdIt from '@/content/METHODOLOGY.it.md?raw'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocale, useT } from '@/i18n/context'
import type { Locale } from '@/i18n/messages'
import { cleanMethodology } from '@/lib/methodology'

const CONTENT: Record<Locale, string> = { en: cleanMethodology(mdEn), it: cleanMethodology(mdIt) }

const components: Components = {
  a: ({ href, children, node: _node, ...rest }) => {
    const external = href !== undefined && /^https?:\/\//.test(href)
    return (
      <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  table: ({ node: _node, ...rest }) => (
    <div className="overflow-x-auto">
      <table {...rest} />
    </div>
  ),
}

export default function Methodology() {
  const t = useT()
  const { locale } = useLocale()
  useDocumentTitle(t.nav.methodology)
  return (
    <article className="prose max-w-none prose-neutral [overflow-wrap:anywhere] prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {CONTENT[locale]}
      </ReactMarkdown>
    </article>
  )
}
