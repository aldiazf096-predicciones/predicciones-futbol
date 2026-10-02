import './globals.css'

export const metadata = {
  metadataBase: new URL('https://www.predicciones.com.mx'),
  title: 'Predicciones de Fútbol | Análisis Profesional en Español',
  description:
    'Predicciones de fútbol en español con probabilidades 1X2 y pronóstico de goles para Premier League, La Liga, Serie A, Bundesliga, Ligue 1 y Liga MX.',
  authors: [{ name: 'Predicciones.com.mx' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Predicciones de Fútbol | Análisis Profesional',
    description:
      'Próximos partidos de las principales ligas con probabilidades 1X2 y pronóstico de goles.',
    url: '/',
    siteName: 'Predicciones.com.mx',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Predicciones de Fútbol',
    description:
      'Próximos partidos de las principales ligas con probabilidades 1X2 y pronóstico de goles.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%238B5CF6'>⚽</text></svg>" />
      </head>
      <body className="bg-black text-white">
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
