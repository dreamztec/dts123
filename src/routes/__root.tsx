import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { IdentityProvider } from '@/lib/identity-context'
import { PwaRegister } from '@/components/PwaRegister'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'FASTRIDES — Your dream destination...on time.' },
      { name: 'description', content: 'FASTRIDES provides premium rides, chauffeur, airport, corporate, events and managed mobility services. Operated by Dreamz Transportz Servicez (DTS).' },
      { name: 'theme-color', content: '#651F2B' },
      { property: 'og:title', content: 'FASTRIDES — Your dream destination...on time.' },
      { property: 'og:description', content: 'Your dream destination...on time. Operated by Dreamz Transportz Servicez (DTS).' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '/logo-512.png' },
      { property: 'og:site_name', content: 'FASTRIDES' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon-64.png', type: 'image/png', sizes: '64x64' },
      { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body><IdentityProvider>{children}<PwaRegister/></IdentityProvider><Scripts /></body></html>
}
