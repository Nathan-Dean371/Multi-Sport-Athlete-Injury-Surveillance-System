import dynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";

const ClientUserActivity = dynamic(() => import("./ClientUserActivity"), {
  suspense: true,
});

export default function UserActivityPage() {
  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">User Activity</h1>
            <p className="text-gray-400 text-sm mt-1">
              View login activity for all users
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={<div className="text-gray-400">Loading activity...</div>}
        >
          <ClientUserActivity />
        </Suspense>
      </main>
    </div>
  );
}
