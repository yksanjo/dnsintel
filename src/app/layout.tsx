import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNSIntel - DNS Security Debugging Suite",
  description: "Developer-focused DNS security and debugging suite with IP intelligence visualization",
  keywords: ["DNS", "security", "debugging", "IP intelligence", "DNS lookup", "attack surface"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
