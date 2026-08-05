import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AK TİCARET YAPI MALZEMELERİ",
    template: "%s | AK TİCARET",
  },
  description:
    "Yapı ve hırdavatta profesyonel çözümler. Kaliteli ürünler, uygun fiyatlar ve profesyonel hizmet. B2B bayi ve B2C perakende.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-mist text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
