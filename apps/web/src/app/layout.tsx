import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trace Library Test App',
  description: 'Testing the trace function library',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}