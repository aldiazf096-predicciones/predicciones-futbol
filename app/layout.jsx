import './globals.css'

export const metadata = {
  title: 'Predicciones de Fútbol | Análisis Profesional en Español',
  description: 'Predicciones matemáticas de fútbol en español. Análisis profesional con probabilidades 1X2, Over/Under y Ambos Anotan. Sin publicidad invasiva. Premium a solo $4.99 MXN/mes.',
  keywords: 'predicciones fútbol, pronosticos deportivos, análisis de partidos, 1x2, over under, predicciones en español',
  authors: [{ name: 'Predicciones.com.mx' }],
  openGraph: {
    title: 'Predicciones de Fútbol | Análisis Profesional',
    description: 'Predicciones de fútbol con análisis matemático e histórico',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Predicciones de Fútbol',
    description: 'Análisis profesional de partidos de fútbol',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
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
