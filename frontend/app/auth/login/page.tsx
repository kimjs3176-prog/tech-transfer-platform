"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const schema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/auth/login", data),
    onSuccess: (res) => {
      setAuth(res.data.access_token, res.data.user);
      localStorage.setItem("token", res.data.access_token);
      router.push("/dashboard");
    },
  });

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-[var(--primary)] p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">TechTransfer</p>
            <p className="text-[10px] text-white/60">Enterprise Portal</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-snug">
            기술이전 계약을<br />더 스마트하게
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            특허 기술이전 신청부터 계약서 출력까지,<br />
            한국농업기술진흥원의 통합 관리 플랫폼입니다.
          </p>
        </div>

        <div className="flex gap-3">
          {["신청 관리", "계약 관리", "실적 보고"].map((label) => (
            <div key={label} className="bg-white/10 rounded-lg px-3 py-2 text-xs font-medium">
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="font-bold text-[var(--primary)]">TechTransfer</p>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">로그인</h1>
            <p className="text-slate-500 text-sm mt-1">계정에 로그인하여 시작하세요.</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">이메일</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="example@agri.kr"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all bg-white placeholder:text-slate-400"
              />
              {errors.email && (
                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-4a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1z"/>
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">비밀번호</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all bg-white placeholder:text-slate-400"
              />
              {errors.password && (
                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-4a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1z"/>
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-4a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1z"/>
                </svg>
                이메일 또는 비밀번호가 올바르지 않습니다.
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[var(--primary)] text-white py-2.5 rounded-xl font-medium hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  로그인 중...
                </>
              ) : "로그인"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            테스트 계정: <span className="font-mono text-slate-500">admin@agri-tech.kr</span>
          </p>
        </div>
      </div>
    </div>
  );
}
