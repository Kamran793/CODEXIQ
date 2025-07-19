'use client'

import { useEffect, useState } from 'react'
import { type Message } from 'ai'
import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'

export interface ChatListProps {
  messages: Message[]
  isLoading?: boolean
  chatId?: string // Add chatId prop
}

export function ChatList({ messages, isLoading, chatId }: ChatListProps) {
  const [animatedIndexes, setAnimatedIndexes] = useState<number[]>([])
  const [animatedText, setAnimatedText] = useState('')
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
  const [typingDots, setTypingDots] = useState('.')
  const [hasAnimatedFirst, setHasAnimatedFirst] = useState(false)

  // Check localStorage for first animation flag
  useEffect(() => {
    if (!chatId) return
    const key = `ai-animated-first-${chatId}`
    const flag = window.localStorage.getItem(key)
    setHasAnimatedFirst(!!flag)
  }, [chatId])

  // Find the first assistant message that hasn't been animated
  useEffect(() => {
    if (hasAnimatedFirst) return // skip animation if already done
    const nextToAnimate = messages.findIndex((msg, idx) =>
      msg.role === 'assistant' && !animatedIndexes.includes(idx)
    )
    if (nextToAnimate !== -1 && animatingIndex === null) {
      setAnimatingIndex(nextToAnimate)
      setAnimatedText('')
    }
  }, [messages, animatedIndexes, animatingIndex, hasAnimatedFirst])

  // Animate the assistant message at animatingIndex
  useEffect(() => {
    if (animatingIndex === null || hasAnimatedFirst) return
    const message = messages[animatingIndex]
    if (!message || message.role !== 'assistant') return
    let i = 0
    setAnimatedText('')
    const interval = setInterval(() => {
      setAnimatedText(message.content.slice(0, i + 1))
      i++
      if (i >= message.content.length) {
        clearInterval(interval)
        setAnimatedIndexes(prev => [...prev, animatingIndex])
        setAnimatingIndex(null)
        // Set flag in localStorage so it doesn't animate again
        if (chatId) {
          window.localStorage.setItem(`ai-animated-first-${chatId}`, '1')
        }
      }
    }, 8)
    return () => clearInterval(interval)
  }, [animatingIndex, messages, chatId, hasAnimatedFirst])

  // Typing dots animation (for loading indicator)
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
        // Animate if this is the current animating assistant message
        const isAnimating = index === animatingIndex && message.role === 'assistant' && !hasAnimatedFirst
        // Show full content if already animated or not an assistant message
        const showFull =
          message.role !== 'assistant' || animatedIndexes.includes(index) || hasAnimatedFirst
        return (
          <div key={index}>
            <ChatMessage
              message={{ ...message, content: showFull ? message.content : isAnimating ? animatedText : '' }}
              isTyping={isAnimating}
              partialContent={isAnimating ? animatedText : ''}
            />
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
