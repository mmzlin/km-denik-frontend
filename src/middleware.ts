import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // KRITICKÉ dle Supabase docs: nesmí být žádný kód mezi
  // createServerClient a getUser, jinak session nemusí být obnovena.
  const { data: { user } } = await supabase.auth.getUser()

  // Chrání /dashboard — nepřihlášený uživatel jde na login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Vyhne se: Next.js interním souborům, statickým assetům, ikonám,
     * favicon, manifest a všem souborům s příponou (obrázky atd.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icons|apple-touch-icon|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
}
