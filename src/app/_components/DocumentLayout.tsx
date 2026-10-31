import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/app/globals.css";
import AuthProvider from "@/components/AuthProvider";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Long Island Zoning Lookup – Nassau & Suffolk Zoning Maps | ezZoning",
  description: "Look up the zoning for any property in Nassau or Suffolk County. See the district, the permitted uses and the building rules for free.",
};

export default function DocumentLayout({
  children,
  headContent,
}: Readonly<{
  children: React.ReactNode;
  headContent?: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {headContent}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:title" content="Long Island Zoning Lookup – Nassau & Suffolk Zoning Maps | ezZoning" />
        <meta property="og:description" content="Look up the zoning for any property in Nassau or Suffolk County. See the district, the permitted uses and the building rules for free." />
        <meta property="og:image" content="https://ezzoning.com/logo.png" />
        <meta property="og:url" content="https://ezzoning.com/" />
      </head>
      <body className={`${outfit.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
