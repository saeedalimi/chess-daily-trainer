import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "تمرین روزانه شطرنج",
  description: "هر روز ۳۰ تمرین شطرنج در سه سطح دشواری — مشابه chess.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <body className={`${vazirmatn.className} h-full w-full overflow-hidden`}>{children}</body>
    </html>
  );
}
