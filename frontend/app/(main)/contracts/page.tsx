"use client";
import { useQuery } from "@tanstack/react-query";
import { contractApi } from "@/lib/api";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "계약서 작성 중",
  INVENTOR_REVIEW: "발명자 의견 대기",
  DEPT_APPROVAL: "부서장 결재 대기",
  REGISTERED: "계약서 등록 완료",
  PUBLISHED: "계약서 출력 완료",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  INVENTOR_REVIEW: "bg-blue-50 text-blue-600",
  DEPT_APPROVAL: "bg-purple-50 text-purple-600",
  REGISTERED: "bg-emerald-50 text-emerald-600",
  PUBLISHED: "bg-green-50 text-green-700",
};

const STATUS_DOTS: Record<string, string> = {
  DRAFT: "bg-slate-400",
  INVENTOR_REVIEW: "bg-blue-500",
  DEPT_APPROVAL: "bg-purple-500",
  REGISTERED: "bg-emerald-500",
  PUBLISHED: "bg-green-600",
};

export default function ContractsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractApi.list().then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">계약 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">기술이전 계약서 및 결재 현황을 관리하세요.</p>
        </div>
      </div>

      {/* Summary badges */}
      {data && data.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = data.filter((c: any) => c.status === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${STATUS_COLORS[key] ?? "bg-slate-100 text-slate-600"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[key] ?? "bg-slate-400"}`} />
                {label} {count}건
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {["계약번호", "상태", "계약기간", "실시료율", "일시불", "생성일", ""].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-sm">불러오는 중...</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span className="text-sm">계약 내역이 없습니다.</span>
                  </div>
                </td>
              </tr>
            )}
            {data?.map((c: any) => (
              <tr key={c.id} className="table-row animate-fade-in">
                <td className="px-5 py-4">
                  <span className="font-mono text-xs font-semibold text-[var(--primary)] bg-blue-50 px-2 py-1 rounded">
                    {c.contract_no}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`badge ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOTS[c.status] ?? "bg-slate-400"}`} />
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500 text-xs">
                  {c.contract_period_start
                    ? `${c.contract_period_start} ~ ${c.contract_period_end}`
                    : "—"}
                </td>
                <td className="px-5 py-4 text-slate-600 font-medium">
                  {c.royalty_rate != null ? (
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">
                      {c.royalty_rate}%
                    </span>
                  ) : "—"}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {c.lump_sum != null ? `${Number(c.lump_sum).toLocaleString()}원` : "—"}
                </td>
                <td className="px-5 py-4 text-slate-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/contracts/${c.id}/approval`}
                    className="inline-flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline"
                  >
                    결재 현황
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.length > 0 && (
        <p className="text-xs text-slate-400 text-right">총 {data.length}건</p>
      )}
    </div>
  );
}
