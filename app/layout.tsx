import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edelweiss Open House 2026",
  description: "Pendaftaran Open House & Assessment Edelweiss School 2026",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo-square.png', type: 'image/png' }
    ],
    apple: '/logo-square.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://eliteacademia.id" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://eliteacademia.id" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
