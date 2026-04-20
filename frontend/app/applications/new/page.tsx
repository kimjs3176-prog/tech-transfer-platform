"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { applicationApi } from "@/lib/api";

const schema = z.object({
  technology_name: z.string().min(1, "기술명을 입력하세요"),
  patent_no: z.string().optional(),
  transfer_type: z.enum(["전용실시", "통상실시", "양도"], { message: "이전 유형을 선택하세요" }),
  purpose: z.string().min(10, "이전 목적을 10자 이상 입력하세요"),
});

type FormData = z.infer<typeof schema>;

export default function NewApplicationPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => applicationApi.create(data),
    onSuccess: () => router.push("/applications"),
  });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--primary)] mb-6">기술이전 신청서 작성</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">기술명 *</label>
          <input {...register("technology_name")} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          {errors.technology_name && <p className="text-red-500 text-xs mt-1">{errors.technology_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">특허번호</label>
          <input {...register("patent_no")} placeholder="예: 10-2023-0012345" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이전 유형 *</label>
          <select {...register("transfer_type")} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">선택</option>
            <option value="전용실시">전용실시</option>
            <option value="통상실시">통상실시</option>
            <option value="양도">양도</option>
          </select>
          {errors.transfer_type && <p className="text-red-500 text-xs mt-1">{errors.transfer_type.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이전 목적 *</label>
          <textarea {...register("purpose")} rows={4} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={mutation.isPending} className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? "제출 중..." : "신청서 제출"}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            취소
          </button>
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm">제출 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        )}
      </form>
    </div>
  );
}
