"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import api from "@/lib/api";

const YEAR = new Date().getFullYear();

export default function TechFeesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => api.get("/performance-reports/stats").then((r) => r.data),
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.get("/performance-reports/").then((r) => r.data),
  });

  const { data: contracts } = useQuery({
    queryKey: ["contracts-simple"],
    queryFn: () => api.get("/contracts/").then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { contract_id: "", report_year: YEAR, report_half: 1, sales_amount: "", royalty_amount: "", report_date: new Date().toISOString().slice(0, 10) },
  });

  const mutation = useMutation({
    mutationFn: (d: any) => api.post("/performance-reports/", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reports"] }); qc.invalidateQueries({ queryKey: ["report-stats"] }); setShowForm(false); reset(); },
  });

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--primary)]">기술료 정산</h1>
          <p className="text-xs text-gray-500 mt-0.5">실시료 납부 및 정산 내역을 관리합니다.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">
          + 실적 보고 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "누적 보고 건수", value: `${stats?.total_reports ?? 0}건`, color: "bg-blue-50 border-blue-200" },
          { label: "총 기술료 수입", value: `${(stats?.total_royalty ?? 0).toLocaleString()}원`, color: "bg-green-50 border-green-200" },
          { label: "총 매출 합계", value: `${(stats?.total_sales ?? 0).toLocaleString()}원`, color: "bg-yellow-50 border-yellow-200" },
        ].map((c) => (
          <div key={c.label} className={`rounded-lg border p-4 ${c.color}`}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-5 border border-blue-200">
          <h2 className="font-semibold mb-4 text-gray-700">실적 보고 등록</h2>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">계약 선택</label>
              <select {...register("contract_id", { required: true })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="">선택</option>
                {contracts?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.contract_no}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">보고 연도</label>
              <input {...register("report_year", { valueAsNumber: true })} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">반기</label>
              <select {...register("report_half", { valueAsNumber: true })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value={1}>상반기 (1~6월)</option>
                <option value={2}>하반기 (7~12월)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">보고일</label>
              <input {...register("report_date")} type="date" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">매출액 (원)</label>
              <input {...register("sales_amount", { valueAsNumber: true })} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">실시료 (원)</label>
              <input {...register("royalty_amount", { valueAsNumber: true })} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-1.5 rounded text-sm text-gray-600">취소</button>
              <button type="submit" disabled={mutation.isPending} className="bg-[var(--primary)] text-white px-5 py-1.5 rounded text-sm">저장</button>
            </div>
          </form>
        </div>
      )}

      {/* 내역 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["계약번호", "보고연도", "반기", "매출액", "실시료", "보고일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>}
            {!isLoading && (!reports || reports.length === 0) && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">실적 보고 내역이 없습니다.</td></tr>
            )}
            {reports?.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">계약 #{r.contract_id}</td>
                <td className="px-4 py-3">{r.report_year}년</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${r.report_half === 1 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                    {r.report_half === 1 ? "상반기" : "하반기"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{r.sales_amount != null ? Number(r.sales_amount).toLocaleString() + "원" : "-"}</td>
                <td className="px-4 py-3 text-right font-medium text-green-700">{r.royalty_amount != null ? Number(r.royalty_amount).toLocaleString() + "원" : "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.report_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
