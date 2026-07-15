import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const vazir = localFont({
  src: [
    {
      path: "../../public/fonts/Vazir-Regular.ttf",
      weight: "400",
    },
    {
      path: "../../public/fonts/Vazir-Bold.ttf",
      weight: "700",
    },
  ],
  display: "swap",
  variable: "--font-vazir",
})

export const metadata: Metadata = {
  title: "گفتان - مدیریت هوشمند جلسات",
  description:
    "ضبط صدا، تبدیل به متن و خلاصه‌سازی هوشمند جلسات با هوش مصنوعی",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
