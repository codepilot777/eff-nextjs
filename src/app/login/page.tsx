"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 帶返上次登入嘅教官名稱，方便重複使用同一部機
function getSavedName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("instructor_user") || "";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/instructor";

  const [name, setName] = useState(getSavedName);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Login failed");
        return;
      }
      localStorage.setItem("instructor_user", name.trim());
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] font-sans flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#1a1a1a] border border-[#333333] rounded-2xl p-8 shadow-lg flex flex-col gap-5"
      >
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">
            Instructor Login
          </h1>
          <p className="text-[#8fa0a6] text-[0.75rem] tracking-widest uppercase mt-1">
            IOS Dispatch Control Access
          </p>
          <p className="text-[#8fa0a6] text-[0.7rem] mt-2">
            Type &quot;admin&quot; as name to manage all sessions.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Capt. Chan or admin"
            className="bg-[#0a0a0a] border border-[#333333] rounded-xl px-4 py-3 text-white outline-none focus:border-[#C6FF00] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333333] rounded-xl px-4 py-3 text-white outline-none focus:border-[#C6FF00] transition-colors"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm font-medium">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !password || !name.trim()}
          className="mt-2 px-4 py-3 bg-[#C6FF00] text-black rounded-xl text-sm font-black tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
