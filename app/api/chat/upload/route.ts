import { NextRequest } from 'next/server'

const SPACE_URL = 'https://mirxakamran893-LOGIQCURVECODE.hf.space/chat'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // Parse multipart form data
  const formData = await req.formData()
  const prompt = formData.get('prompt') as string
  const file = formData.get('file') as File | null

  if (!prompt && !file) {
    return new Response(JSON.stringify({ error: 'No prompt or file provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Prepare form data for HuggingFace
  const hfForm = new FormData()
  if (prompt) hfForm.append('prompt', prompt)
  if (file) hfForm.append('file', file, file.name)

  try {
    const res = await fetch(SPACE_URL, {
      method: 'POST',
      body: hfForm
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return new Response(JSON.stringify({ error: errText || 'HuggingFace error' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const data = await res.json().catch(() => ({}))
    return new Response(JSON.stringify({ response: data?.response || 'No response' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
