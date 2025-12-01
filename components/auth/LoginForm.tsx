"use client";
import Link from "next/link";

export default function LoginForm() {
  return (
    <div className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white" />
          <h1 className="text-xl font-semibold">Sign in</h1>
        </div>
        <p className="mb-6 text-sm text-gray-300">
          Continue to your Interview AI workspace.
        </p>
        <div className="space-y-3">
          <a
            href="/auth/login?returnTo=/home"
            className="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow transition hover:bg-gray-100"
          >
            Continue with Auth0
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 text-xs text-gray-400 underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}


