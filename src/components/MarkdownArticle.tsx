import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

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

/** Long-form Markdown content (methodology, privacy notice). Raw HTML in the source is skipped. */
export function MarkdownArticle({ children, className }: { children: string; className?: string }) {
  return (
    <article className={cn('prose max-w-none prose-neutral prose-a:text-link prose-headings:text-link [overflow-wrap:anywhere] prose-code:before:content-none prose-code:after:content-none dark:prose-invert', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </article>
  )
}
