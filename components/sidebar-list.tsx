'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'
import { type Chat } from '@/lib/types'

export interface SidebarListProps {
  userId?: string
}

export function SidebarList({ userId }: SidebarListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChats = async () => {
    if (!userId) return
    setLoading(true)
    const supabase = createClientComponentClient()
    const { data, error } = await supabase
      .from('chats')
      .select('payload')
      .order('payload->createdAt', { ascending: false })
      .eq('user_id', userId)

    if (!error && data) {
      setChats((data as any[]).map(entry => entry.payload) as Chat[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChats()
  }, [userId])

  // ✅ Proper function signatures to match SidebarActions props
  const removeChat = async ({ id, path }: { id: string; path: string }) => {
    // Optionally delete from Supabase if needed
    setChats(prev => prev.filter(chat => chat.id !== id))
  }

  const shareChat = async ({ id, path }: { id: string; path: string }) => {
    alert(`Shared chat ID: ${id}, path: ${path}`)
  }

  const renameChat = async ({ id, newTitle }: { id: string; newTitle: string }) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {loading ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading chat history...</p>
        </div>
      ) : chats?.length ? (
        <div className="space-y-2 px-2">
          {chats.map((chat: Chat) =>
            chat ? (
              <SidebarItem key={chat.id} chat={chat}>
                <SidebarActions
                  chat={chat}
                  removeChat={removeChat}
                  shareChat={shareChat}
                  renameChat={renameChat}
                />
              </SidebarItem>
            ) : null
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  )
}
