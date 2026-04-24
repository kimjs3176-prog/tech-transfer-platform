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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        {/* 로고 */}
        <div className="text-center">
          <div className="inline-block bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded mb-3">
            NATI
          </div>
          <h1 className="text-lg font-bold text-gray-800">기술이전계약관리 플랫폼</h1>
          <p className="text-xs text-gray-400 mt-1">한국농업기술진흥원</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="example@agri.kr"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm text-center">
              이메일 또는 비밀번호가 올바르지 않습니다.
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {mutation.isPending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          관리자 계정: admin@agri-tech.kr
        </p>
      </div>
    </div>
  );
}
