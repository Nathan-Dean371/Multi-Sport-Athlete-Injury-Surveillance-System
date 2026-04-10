"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
    } catch {
      // Error is already handled by the store
      setLocalError(error || "Login failed. Please check your credentials.");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Injury Surveillance
          </h1>
          <p className="text-gray-400">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                {displayError}
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-400 text-sm">
              <p className="font-semibold text-blue-300 mb-2">
                Test Credentials:
              </p>
              <p className="text-xs">
                Password:{" "}
                <code className="bg-blue-900/50 px-1 rounded">password123</code>
              </p>
              <p className="text-xs mt-1">
                Contact your admin for email addresses
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition duration-200 mt-6"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 Multi-Sport Athlete Injury Surveillance System
        </p>
      </div>
    </div>
  );
}
