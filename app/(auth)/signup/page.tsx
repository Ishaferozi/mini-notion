import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "Create account – Mini Notion",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white text-lg font-bold">
            N
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Create your account
          </h1>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
