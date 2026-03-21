import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Admin Dashboard - Injury Surveillance System",
  description: "Admin dashboard for managing sports injury surveillance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
