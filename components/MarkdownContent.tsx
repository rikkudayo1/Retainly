import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-black mb-2 bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--theme-gradient)" }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-black mb-2 mt-4"
            style={{ color: "var(--theme-badge-text)" }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1 mt-3"
            style={{ color: "var(--theme-badge-text)" }}>{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 ml-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 ml-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed flex gap-2">
            <span style={{ color: "var(--theme-primary)" }}>•</span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-bold" style={{ color: "var(--theme-badge-text)" }}>{children}</strong>
        ),
        code: ({ children }) => (
          <code className="text-xs px-1.5 py-0.5 rounded-md font-mono"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--theme-badge-text)" }}>
            {children}
          </code>
        ),
        hr: () => (
          <hr className="my-3 border-none h-px"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.2)` }} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownContent;