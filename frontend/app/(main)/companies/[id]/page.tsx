"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";

const inp = "w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-2">
      <label className="text-sm font-medium text-gray-700 pt-1.5">{label}</label>
      <div>{children}</div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => api.get(`/companies/${id}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (company) reset(company);
  }, [company, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch(`/companies/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      router.push("/companies");
    },
  });

  if (isLoading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-5">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← 목록으로</button>
        <h1 className="text-xl font-bold text-[var(--primary)] mt-1">업체 상세 / 수정</h1>
        <p className="text-xs text-gray-500">{company?.company_name}</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">기본 정보</h2>
          <Field label="업체명"><input {...register("company_name")} className={inp} /></Field>
          <Field label="사업자등록번호"><input {...register("business_reg_no")} className={inp} /></Field>
          <Field label="법인등록번호"><input {...register("corp_reg_no")} className={inp} /></Field>
          <Field label="대표자"><input {...register("representative")} className={inp} /></Field>
          <Field label="설립년월일"><input {...register("established_date")} type="date" className={inp} /></Field>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">사업 분류</h2>
          <Field label="업태"><input {...register("biz_type")} className={inp} /></Field>
          <Field label="업종"><input {...register("industry")} className={inp} /></Field>
          <Field label="생산품목"><textarea {...register("products")} rows={2} className={inp} /></Field>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">연락처</h2>
          <Field label="본사 주소"><input {...register("hq_address")} className={inp} /></Field>
          <Field label="전화번호"><input {...register("company_phone")} className={inp} /></Field>
          <Field label="FAX"><input {...register("company_fax")} className={inp} /></Field>
          <Field label="홈페이지"><input {...register("homepage")} className={inp} /></Field>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">기업 규모</h2>
          <Field label="임직원 수"><input {...register("employee_count")} type="number" className={inp} /></Field>
          <Field label="자본금"><input {...register("capital")} type="number" className={inp} /></Field>
          <Field label="연매출"><input {...register("annual_revenue")} type="number" className={inp} /></Field>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">비고</h2>
          <textarea {...register("memo")} rows={3} className={inp} />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button type="submit" disabled={mutation.isPending} className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
