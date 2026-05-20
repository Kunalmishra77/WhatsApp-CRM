import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }

  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))
  const redirectUrl = request.nextUrl.clone()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirectUrl.pathname = next
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  redirectUrl.pathname = '/login'
  redirectUrl.searchParams.set(
    'error',
    'The email link is invalid or expired. Please request a new link.'
  )
  return NextResponse.redirect(redirectUrl)
}
