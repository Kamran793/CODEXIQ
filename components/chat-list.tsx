'use client'

import { useEffect, useState } from 'react'
import { type Message } from 'ai'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'

export interface ChatListProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatList({ messages, isLoading }: ChatListProps) {
  const [animatedText, setAnimatedText] = useState('')
  const [typingDots, setTypingDots] = useState('.')

  const lastMessage = messages[messages.length - 1]
  const isAssistantTyping = isLoading && lastMessage?.role === 'assistant'

  // Typing animation for assistant message
  useEffect(() => {
    if (isAssistantTyping && lastMessage?.content) {
      setAnimatedText('')
      let i = 0
      const interval = setInterval(() => {
        setAnimatedText(lastMessage.content.slice(0, i + 1))
        i++
        if (i >= lastMessage.content.length) clearInterval(interval)
      }, 20)
      return () => clearInterval(interval)
    } else {
      setAnimatedText(lastMessage?.content || '')
    }
  }, [lastMessage?.content, isAssistantTyping])

  // Dots animation for "Typing..."
  useEffect(() => {
    if (!isLoading) return
    const dotInterval = setInterval(() => {
      setTypingDots(prev => (prev === '...' ? '.' : prev + '.'))
    }, 500)
    return () => clearInterval(dotInterval)
  }, [isLoading])

  if (!messages.length) return null

  return (
    <div className="relative mx-auto max-w-5xl px-4">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1

        return (
          <div key={index}>
            {isLast && isAssistantTyping ? (
              <ChatMessage message={{ ...message, content: animatedText }} />
            ) : (
              <ChatMessage message={message} />
            )}
            {index < messages.length - 1 && (
              <Separator className="my-4 md:my-8" />
            )}
          </div>
        )
      })}

      {isLoading && (
        <div className="text-sm text-gray-500 mt-2 ml-2 animate-pulse">
          Codex-IQ is typing{typingDots}
        </div>
      )}
    </div>
  )
}
