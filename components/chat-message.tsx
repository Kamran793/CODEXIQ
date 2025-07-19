'use client'

import { useEffect, useState } from 'react'
import { type Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { ChatMessageActions } from '@/components/chat-message-actions'

export interface ChatMessageProps {
  message: Message
  isTyping?: boolean
  partialContent?: string
}

export function ChatMessage({ message, isTyping = false, partialContent = '', ...props }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'group relative mb-4 flex w-full items-start',
        'flex-row'
      )}
      {...props}
    >
      <div
        className={cn(
          'flex-1 space-y-2 overflow-hidden px-1',
          message.role === 'user' ? 'ml-4' : 'ml-4'
        )}
      >
        <div className="font-semibold text-sm mb-2">
          {message.role === 'user' ? 'You:' : 'CODEX-IQ:'}
        </div>

        {isTyping ? (
          <div className="whitespace-pre-wrap font-normal text-sm">
            <MemoizedReactMarkdown
              className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                code({ node, inline, className, children, ...props }) {
                  if (children.length) {
                    if (children[0] === '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">▍</span>
                      );
                    }
                    children[0] = (children[0] as string).replace('`▍`', '▍');
                  }
                  const match = /language-(\w+)/.exec(className || '');
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  );
                },
              }}
            >
              {partialContent}
            </MemoizedReactMarkdown>
            <span className="animate-pulse">▍</span>
          </div>
        ) : (
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] === '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">▍</span>
                    )
                  }

                  children[0] = (children[0] as string).replace('`▍`', '▍')
                }

                const match = /language-(\w+)/.exec(className || '')

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                )
              }
            }}
          >
            {message.content}
          </MemoizedReactMarkdown>
        )}

        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
