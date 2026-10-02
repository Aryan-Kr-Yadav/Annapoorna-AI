import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Pre-processes message content to cleanly format raw math brackets like \[ formula \] or \( formula \)
 * into readable mathematical expressions so users never see literal escaped brackets.
 */
function cleanMathFormulas(content) {
  if (!content || typeof content !== "string") return "";

  // Replace block formulas: \[ expr \] -> expr formatted cleanly
  let cleaned = content.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, formula) => {
    const trimmed = formula.trim();
    return `\n\n> 📐 **Formula:** \`${trimmed}\`\n\n`;
  });

  // Replace inline formulas: \( expr \) -> `expr`
  cleaned = cleaned.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, formula) => {
    return `\`${formula.trim()}\``;
  });

  return cleaned;
}

/**
 * Reusable Markdown Message Renderer for Annapoorna AI Assistant.
 * Fully supports GFM (tables, tasklists, autolinks), restrained conversational typography,
 * responsive scrollable tables, and dark/light mode compatibility.
 */
export function MarkdownMessage({ content, className = "" }) {
  const processedContent = useMemo(() => cleanMathFormulas(content), [content]);

  if (!content) return null;

  return (
    <div className={`markdown-message space-y-2.5 text-xs sm:text-sm leading-relaxed overflow-hidden ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Conversational headings (restrained, no giant webpage H1s)
          h1: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-3 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-2.5 mb-1 first:mt-0 tracking-tight">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-primary-900 dark:text-primary-300 mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-1.5 mb-0.5">
              {children}
            </h5>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="leading-relaxed text-stone-800 dark:text-stone-200 mb-2 last:mb-0">
              {children}
            </p>
          ),

          // Bold & Emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-stone-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-stone-800 dark:text-stone-300">
              {children}
            </em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-2 text-stone-800 dark:text-stone-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-2 text-stone-800 dark:text-stone-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:text-primary-600 dark:marker:text-primary-400">
              {children}
            </li>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 pl-3 py-1 my-2 rounded-r-md text-stone-700 dark:text-stone-300 italic">
              {children}
            </blockquote>
          ),

          // Responsive Tables (Scrollable container without horizontal page overflow)
          table: ({ children }) => (
            <div className="w-full my-3 overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700/60 shadow-2xs">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700/60 text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-stone-100 dark:bg-stone-800/80 font-bold text-stone-900 dark:text-stone-100">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-[#16241a]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-stone-50/60 dark:hover:bg-primary-900/10">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-2xs uppercase tracking-wider font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs whitespace-normal text-stone-700 dark:text-stone-300">
              {children}
            </td>
          ),

          // Code
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-primary-700 dark:text-primary-300 font-mono text-2xs">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 rounded-lg bg-stone-900 text-stone-100 overflow-x-auto font-mono text-2xs leading-normal">
                <code>{children}</code>
              </pre>
            );
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 font-semibold underline underline-offset-2 hover:text-primary-700 transition"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-3 border-stone-200 dark:border-stone-800" />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessage;
