import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';

interface XoraMarkdownRendererProps {
  content: string;
  onNavigateInternal?: (route: string) => void;
}

export const XoraMarkdownRenderer: React.FC<XoraMarkdownRendererProps> = ({
  content,
  onNavigateInternal,
}) => {
  return (
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code Block with Copy Button
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={match?.[1] || 'code'} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-black/50 text-violet-300 font-mono text-xs border border-white/10"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Safe Link Component
          a({ node, href, children, ...props }: any) {
            const url = href || '';
            const isInternal = url.startsWith('/') || url.startsWith('#');

            if (isInternal) {
              return (
                <button
                  type="button"
                  onClick={() => onNavigateInternal && onNavigateInternal(url)}
                  className="text-violet-400 hover:text-violet-300 font-bold underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{children}</span>
                  <ArrowRight className="w-3 h-3 inline" />
                </button>
              );
            }

            // Safe external link
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline inline-flex items-center gap-0.5"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline opacity-70" />
              </a>
            );
          },

          // Tables
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }: any) {
            return (
              <th className="p-2.5 font-mono font-bold text-zinc-300 bg-white/5 border-b border-white/10 uppercase text-[11px]">
                {children}
              </th>
            );
          },
          td({ children }: any) {
            return <td className="p-2.5 border-b border-white/5 text-zinc-300">{children}</td>;
          },

          // Headings
          h1: ({ children }: any) => <h1 className="text-base sm:text-lg font-black text-white mt-4 mb-2">{children}</h1>,
          h2: ({ children }: any) => <h2 className="text-sm sm:text-base font-bold text-violet-300 mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }: any) => <h3 className="text-xs sm:text-sm font-bold text-zinc-100 mt-2.5 mb-1">{children}</h3>,

          // Lists
          ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300">{children}</ul>,
          ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300">{children}</ol>,
          li: ({ children }: any) => <li className="text-zinc-300">{children}</li>,

          // Blockquote
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-2 border-violet-500 pl-3 my-2 text-zinc-400 italic bg-violet-500/5 py-1 rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-2xl bg-[#0b0d14] border border-white/10 overflow-hidden shadow-lg group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121520] border-b border-white/5 text-[11px] font-mono text-zinc-400">
        <span className="uppercase text-[10px] font-bold text-violet-400 tracking-wider">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text */}
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed scrollbar-none">
        <code>{code}</code>
      </pre>
    </div>
  );
};
