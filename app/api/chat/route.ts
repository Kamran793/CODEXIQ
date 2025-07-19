import 'server-only'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

// Use environment variable for OpenRouter API key
// Note: process.env is not available in the Next.js edge runtime. For edge runtime, use (globalThis as any).process?.env or set the variable at build time in Vercel.
const OPENROUTER_API_KEY = ((globalThis as any).process?.env?.OPENROUTER_API_KEY as string | undefined)
if (!OPENROUTER_API_KEY) {
  throw new Error('CODEX-IQ API KEY IS MISSING')
}
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const runtime = 'edge'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth({ cookieStore }))?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    // You may set another API key for preview, if needed
  }

  // Ensure that messages contain valid content
  const messageContents = messages.map((msg: { content: string }) => msg.content).join('\n')

  if (!messageContents.trim()) {
    return new Response('⚠️ Please enter a valid message.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Explicitly define the type for history
  const history: [string, string][] = [] // [messageContent, role] - an empty history for now

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // Set 60 seconds timeout

  try {
    // Prepare OpenRouter API request
    const openRouterRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-coder-32b-instruct:free', // Hardcoded model for OpenRouter
        messages: [
          { role: 'user', content: messageContents }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!openRouterRes.ok || !openRouterRes.body) {
      const errText = await openRouterRes.text().catch(() => '')
      // Check for daily limit exceeded in error text
      if (errText && errText.toLowerCase().includes('daily limit')) {
        return new Response('CODEX-IQ: You Consumed your daily limit buy pro or wait 24 hours', {
          status: 429,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      console.error(`❌ OpenRouter error ${openRouterRes.status}:`, errText)
      return new Response(`🤖 Error ${openRouterRes.status}: OpenRouter API failed.`, {
        status: openRouterRes.status,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    const data = await openRouterRes.json().catch(() => ({}))
    // OpenRouter returns choices[0].message.content
    const reply = data?.choices?.[0]?.message?.content || '⚠️ No valid response received.'

    // Save chat into the database
    const title = messageContents.substring(0, 100)
    const id = json.id ?? nanoid()
    const createdAt = Date.now()
    const path = `/chat/${id}`
    const payload = {
      id,
      title,
      userId,
      createdAt,
      path,
      messages: [
        ...messages,
        {
          content: reply,
          role: 'assistant'
        }
      ]
    }
    // Insert chat into the database.
    await supabase.from('chats').upsert({ id, payload }).throwOnError()

    return new Response(reply, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    const message = isTimeout
      ? '⌛ Timeout: OpenRouter took too long to respond.'
      : `❌ Unexpected error: ${err.message || 'unknown'}`

    // Check for daily limit exceeded in error message
    if (err.message && err.message.toLowerCase().includes('daily limit')) {
      return new Response('CODEX-IQ: You Consumed your daily limit buy pro or wait 24 hours', {
        status: 429,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return new Response(message, {
      status: isTimeout ? 504 : 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
