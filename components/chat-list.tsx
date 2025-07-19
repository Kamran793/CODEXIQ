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
  const [animatedMessageIds, setAnimatedMessageIds] = useState<string[]>([])

  // Load animated message IDs from localStorage
  useEffect(() => {
    if (!chatId) return
    const key = `ai-animated-message-ids-${chatId}`
    const stored = window.localStorage.getItem(key)
    if (stored) {
      try {
        setAnimatedMessageIds(JSON.parse(stored))
      } catch {
        setAnimatedMessageIds([])
      }
    } else {
      setAnimatedMessageIds([])
    }
  }, [chatId])

  // Find the first assistant message that hasn't been animated (by id)
  useEffect(() => {
    if (!chatId) return
    const nextToAnimate = messages.findIndex((msg, idx) =>
      msg.role === 'assistant' && msg.id && !animatedMessageIds.includes(msg.id) && !animatedIndexes.includes(idx)
    )
    if (nextToAnimate !== -1 && animatingIndex === null) {
      setAnimatingIndex(nextToAnimate)
      setAnimatedText('')
    }
  }, [messages, animatedIndexes, animatingIndex, animatedMessageIds, chatId])

  // Animate the assistant message at animatingIndex
  useEffect(() => {
    if (animatingIndex === null) return
    const message = messages[animatingIndex]
    if (!message || message.role !== 'assistant' || !message.id) return
    let i = 0
    setAnimatedText('')
    const interval = setInterval(() => {
      setAnimatedText(message.content.slice(0, i + 1))
      i++
      if (i >= message.content.length) {
        clearInterval(interval)
        setAnimatedIndexes(prev => [...prev, animatingIndex])
        setAnimatingIndex(null)
        // Add this message id to localStorage so it doesn't animate again
        if (chatId && message.id) {
          const key = `ai-animated-message-ids-${chatId}`
          let updatedIds = [...animatedMessageIds, message.id]
          // Remove duplicates just in case
          updatedIds = Array.from(new Set(updatedIds))
          setAnimatedMessageIds(updatedIds)
          window.localStorage.setItem(key, JSON.stringify(updatedIds))
        }
      }
    }, 8)
    return () => clearInterval(interval)
  }, [animatingIndex, messages, chatId, animatedMessageIds])

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
        const isAnimating = index === animatingIndex && message.role === 'assistant' && message.id && !animatedMessageIds.includes(message.id)
        // Show full content if already animated or not an assistant message
        const showFull =
          message.role !== 'assistant' || (message.id && animatedMessageIds.includes(message.id)) || animatedIndexes.includes(index)
        return (
          <div key={message.id || index}>
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
