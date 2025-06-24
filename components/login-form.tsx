'use client'

import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { Input } from './ui/input'
import { Label } from './ui/label'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  action: 'sign-in' | 'sign-up'
}

export function LoginForm({
  className,
  action = 'sign-in',
  ...props
}: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient() // Supabase client for authentication

  const [formState, setFormState] = React.useState<{
    email: string
    password: string
  }>({
    email: '',
    password: ''
  })

  const signIn = async () => {
    const { email, password } = formState
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return error
  }

  const signUp = async () => {
    const { email, password } = formState
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` } // For email-based auth
    })

    if (!error && !data.session)
      toast.success('Check your inbox to confirm your email address!')
    return error
  }

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setIsLoading(true)

    const error = action === 'sign-in' ? await signIn() : await signUp()

    if (error) {
      setIsLoading(false)
      toast.error(error.message)
      return
    }

    setIsLoading(false)
    router.refresh()
  }

  // Function for Google Sign-In OAuth handling
  const signInWithGoogle = async () => {
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', // Google OAuth provider
      options: {
        redirectTo: 'https://codexiq.vercel.app/', // Correct redirect URL after login
      },
    })

    if (error) {
      setIsLoading(false)
      toast.error(error.message)
      return
    }

    // After successful login, forcefully redirect to the homepage
    setTimeout(() => {
      // Remove the redirectedFrom query parameter and redirect to the homepage
      const url = new URL(window.location.href)
      url.searchParams.delete('redirectedFrom')  // Remove `redirectedFrom` query param
      window.history.replaceState({}, '', url.toString())  // Update the URL without reloading the page
      router.push('https://codexiq.vercel.app/')  // Navigate to homepage
    }, 1000) // Optional: Delay the redirect to ensure smooth flow
  }

  return (
    <div {...props}>
      <form onSubmit={handleOnSubmit}>
        <fieldset className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              value={formState.email}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  email: e.target.value
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              value={formState.password}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  password: e.target.value
                }))
              }
            />
          </div>
        </fieldset>

        <div className="mt-4 flex items-center">
          <Button disabled={isLoading}>
            {isLoading && <IconSpinner className="mr-2 animate-spin" />}
            {action === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </Button>
          <p className="ml-4">
            {action === 'sign-in' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="font-medium">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/sign-in" className="font-medium">
                  Sign In
                </Link>
              </>
            )}
          </p>
        </div>
      </form>

      {/* Google Sign-In Button */}
      <div className="mt-4">
        <Button onClick={signInWithGoogle} disabled={isLoading} className="w-full">
          {isLoading && <IconSpinner className="mr-2 animate-spin" />}
          Sign In with Google
        </Button>
      </div>
    </div>
  )
}
