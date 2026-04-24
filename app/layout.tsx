import "./globals.css";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HestaBit Bid Bot",
  description: "Internal Upwork proposal generator",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {user && (
          <header className="border-b border-gray-200 bg-white">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-6">
                <Link href="/chat" className="font-semibold">
                  HestaBit Bid Bot
                </Link>
                <Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900">
                  Chat
                </Link>
                <Link
                  href="/history"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  History
                </Link>
                <Link
                  href="/feedback"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Feedback
                </Link>
                <Link
                  href="/admin/portfolio"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Portfolio
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Users
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{user.email}</span>
                <SignOutButton />
              </div>
            </nav>
          </header>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
