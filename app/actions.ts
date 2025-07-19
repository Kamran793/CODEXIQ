'use server'
import 'server-only'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { type Chat } from '@/lib/types'
import { auth } from '@/auth'

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    const { data } = await supabase
      .from('chats')
      .select('payload')
      .order('payload->createdAt', { ascending: false })
      .eq('user_id', userId)
      .throwOnError()

    return (data?.map(entry => entry.payload) as Chat[]) ?? []
  } catch (error) {
    return []
  }
}

export async function getChat(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data } = await supabase
    .from('chats')
    .select('payload')
    .eq('id', id)
    .maybeSingle()

  return (data?.payload as Chat) ?? null
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  try {
    const cookieStore = cookies()
    const session = await auth({ cookieStore })
    const userId = session?.user?.id
    if (!userId) {
      return { error: 'Unauthorized' }
    }
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    await supabase.from('chats').delete().eq('id', id).eq('user_id', userId).throwOnError()

    revalidatePath('/')
    return revalidatePath(path)
  } catch (error) {
    return {
      error: 'Unauthorized'
    }
  }
}

export async function clearChats() {
  try {
    const cookieStore = cookies()
    const session = await auth({ cookieStore })
    const userId = session?.user?.id
    if (!userId) {
      return { error: 'Unauthorized' }
    }
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    await supabase.from('chats').delete().eq('user_id', userId).throwOnError()
    revalidatePath('/')
    return
  } catch (error) {
    console.log('clear chats error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getSharedChat(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data } = await supabase
    .from('chats')
    .select('payload')
    .eq('id', id)
    .not('payload->sharePath', 'is', null)
    .maybeSingle()

  return (data?.payload as Chat) ?? null
}

export async function shareChat(chat: Chat) {
  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  await supabase
    .from('chats')
    .update({ payload: payload as any })
    .eq('id', chat.id)
    .throwOnError()

  return payload
}

export async function renameChat({ id, title }: { id: string; title: string }) {
  try {
    const cookieStore = cookies()
    const session = await auth({ cookieStore })
    const userId = session?.user?.id
    if (!userId) {
      return { error: 'Unauthorized' }
    }
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    // Fetch the current chat payload
    const { data, error } = await supabase
      .from('chats')
      .select('payload')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) {
      return { error: 'Chat not found' }
    }
    const oldPayload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
      ? data.payload
      : {};
    const payload = { ...oldPayload, title };
    await supabase
      .from('chats')
      .update({ payload })
      .eq('id', id)
      .eq('user_id', userId)
      .throwOnError()
    revalidatePath('/')
    return
  } catch (error) {
    return { error: 'Failed to rename chat' }
  }
}
