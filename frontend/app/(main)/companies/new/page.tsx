"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type FormData = {
  company_name: string;
  business_reg_no?: string;
  corp_reg_no?: string;
  representative?: string;
  established_date?: string;
  biz_type?: string;
  industry?: string;
  hq_address?: string;
  company_phone?: string;
  company_fax?: string;
  homepage?: string;
  products?: string;
  employee_count?: number;
  capital?: number;
  annual_revenue?: number;
  memo?: string;
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-2">
      <label className="text-sm font-medium text-gray-700 pt-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

const inp = "w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

export default function NewCompanyPage({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const isEdit = false;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/companies/", data),
    onSuccess: () => router.push("/companies"),
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-5">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← 목록으로</button>
        <h1 className="text-xl font-bold text-[var(--primary)] mt-1">업체 등록</h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">기본 정보</h2>
          <Field label="업체명" required>
            <input {...register("company_name", { required: "업체명을 입력하세요" })} className={inp} />
            {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>}
          </Field>
          <Field label="사업자등록번호">
            <input {...register("business_reg_no")} placeholder="000-00-00000" className={inp} />
          </Field>
          <Field label="법인등록번호">
            <input {...register("corp_reg_no")} className={inp} />
          </Field>
          <Field label="대표자">
            <input {...register("representative")} className={inp} />
          </Field>
          <Field label="설립년월일">
            <input {...register("established_date")} type="date" className={inp} />
          </Field>
        </div>

        {/* 사업 분류 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">사업 분류</h2>
          <Field label="업태">
            <input {...register("biz_type")} placeholder="예: 제조업" className={inp} />
          </Field>
          <Field label="업종">
            <input {...register("industry")} placeholder="예: 전자부품 제조" className={inp} />
          </Field>
          <Field label="생산품목">
            <textarea {...register("products")} rows={2} className={inp} />
          </Field>
        </div>

        {/* 연락처 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">연락처 및 주소</h2>
          <Field label="본사 주소">
            <input {...register("hq_address")} className={inp} />
          </Field>
          <Field label="전화번호">
            <input {...register("company_phone")} placeholder="02-0000-0000" className={inp} />
          </Field>
          <Field label="FAX">
            <input {...register("company_fax")} className={inp} />
          </Field>
          <Field label="홈페이지">
            <input {...register("homepage")} placeholder="https://" className={inp} />
          </Field>
        </div>

        {/* 규모 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">기업 규모</h2>
          <Field label="임직원 수">
            <input {...register("employee_count", { valueAsNumber: true })} type="number" placeholder="명" className={inp} />
          </Field>
          <Field label="자본금">
            <input {...register("capital", { valueAsNumber: true })} type="number" placeholder="원" className={inp} />
          </Field>
          <Field label="연매출">
            <input {...register("annual_revenue", { valueAsNumber: true })} type="number" placeholder="원" className={inp} />
          </Field>
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">비고</h2>
          <textarea {...register("memo")} rows={3} className={inp} placeholder="특이사항 등..." />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm">저장 중 오류가 발생했습니다.</p>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" disabled={mutation.isPending} className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
