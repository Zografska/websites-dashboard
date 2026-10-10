import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import md from '@/content/METHODOLOGY.md?raw'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cleanMethodology } from '@/lib/methodology'

const content = cleanMethodology(md)

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
  useDocumentTitle('Methodology')
  return (
    <article className="prose max-w-none prose-neutral [overflow-wrap:anywhere] prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
