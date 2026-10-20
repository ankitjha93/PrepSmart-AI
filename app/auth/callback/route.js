import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Determine base URL (accounting for reverse proxy / load balancer headers)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin;

  // Sanitize next redirect target to prevent open redirects
  let rawNext = searchParams.get('next') ?? '/dashboard';
  if (!rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.includes(':')) {
    rawNext = '/dashboard';
  }

  if (errorParam) {
    const errorMsg = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(`${baseUrl}/sign-in?error=${errorMsg}`);
  }

  if (code) {
    try {
      const cookieStore = cookies();
      let response = NextResponse.redirect(`${baseUrl}${rawNext}`);

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session) {
        response.cookies.set('prepsmart_user_session', 'true', {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        // Clear demo session cookie if real user signs in
        response.cookies.delete('prepsmart_demo_session');
        return response;
      }

      if (error) {
        console.error('Supabase code exchange error:', error);
        return NextResponse.redirect(
          `${baseUrl}/sign-in?error=${encodeURIComponent(error.message || 'auth_callback_failed')}`
        );
      }
    } catch (e) {
      console.error('Error exchanging auth code:', e);
    }
  }

  return NextResponse.redirect(`${baseUrl}/sign-in?error=auth_callback_failed`);
}
