import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import { SessionSync } from "@/components/session-sync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VCEcom Storefront",
  description: "Modern ecommerce storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <SessionSync />
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
