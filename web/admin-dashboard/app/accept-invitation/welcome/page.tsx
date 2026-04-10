"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const name = searchParams.get("name");

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Invalid Access
            </h1>
            <p className="text-gray-400 mb-6">
              This page requires valid account information.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Success Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-8 text-center">
            <svg
              className="w-20 h-20 text-white mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-3xl font-bold text-white mb-2">
              Account Created Successfully!
            </h1>
            <p className="text-green-100">
              Welcome to the Multi-Sport Athlete Injury Surveillance System
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* User Info */}
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Account Details
              </h2>
              <div className="space-y-2">
                {name && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-gray-300">{name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-300">{email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-300">Role: Coach</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Next Steps
              </h2>
              <ol className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                    1
                  </span>
                  <span>
                    Download the mobile app using one of the options below
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                    2
                  </span>
                  <span>
                    Open the app and log in with your email and password
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                    3
                  </span>
                  <span>Start managing your teams and reporting injuries</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* App Download Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Download the Mobile App
            </h2>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-gray-300 mb-6">
              The Injury Surveillance mobile app is where you&apos;ll manage
              your teams, report injuries, and track athlete safety.
            </p>

            {/* Development Mode Notice */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-blue-300 font-semibold mb-2">
                    Development/Testing Access
                  </h3>
                  <p className="text-blue-200 text-sm mb-3">
                    The app is currently in development. Use Expo Go to access
                    the test version:
                  </p>
                  <ol className="text-blue-200 text-sm space-y-2">
                    <li>1. Download Expo Go from your app store</li>
                    <li>
                      2. Contact your administrator for the QR code or project
                      link
                    </li>
                    <li>3. Scan the QR code or open the link in Expo Go</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* App Store Buttons (for future production use) */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* iOS App Store */}
              <button
                disabled
                className="flex items-center gap-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-lg transition-colors border border-gray-600"
              >
                <svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="text-lg font-semibold text-white">
                    App Store
                  </div>
                  <div className="text-xs text-gray-500">(Coming Soon)</div>
                </div>
              </button>

              {/* Google Play Store */}
              <button
                disabled
                className="flex items-center gap-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-lg transition-colors border border-gray-600"
              >
                <svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-400">GET IT ON</div>
                  <div className="text-lg font-semibold text-white">
                    Google Play
                  </div>
                  <div className="text-xs text-gray-500">(Coming Soon)</div>
                </div>
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                Need Help?
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                If you have any questions or need assistance getting started,
                please contact your administrator or reach out to support.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:support@example.com"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Contact Support
                </a>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2026 Multi-Sport Athlete Injury Surveillance System</p>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
