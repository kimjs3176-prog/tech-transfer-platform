"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { applicationApi } from "@/lib/api";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  WAITING: "점수 대기",
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  PATENT_CHECK: "특허청 확인",
  APPROVED: "승인",
  REJECTED: "반려",
  CONTRACT_DRAFT: "계약서 작성",
  COMPLETED: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-slate-100 text-slate-600",
  RECEIVED: "bg-blue-50 text-blue-600",
  REVIEWING: "bg-amber-50 text-amber-600",
  PATENT_CHECK: "bg-sky-50 text-sky-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-500",
  CONTRACT_DRAFT: "bg-violet-50 text-violet-600",
  COMPLETED: "bg-green-50 text-green-600",
};

const FILTERS = [
  { key: "", label: "전체" },
  { key: "WAITING", label: "점수 대기" },
  { key: "RECEIVED", label: "접수" },
  { key: "APPROVED", label: "승인" },
  { key: "REJECTED", label: "반려" },
];

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["applications", statusFilter],
    queryFn: () =>
      applicationApi.list({ status: statusFilter || undefined }).then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">신청 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">기술이전 신청서를 관리하세요.</p>
        </div>
        <Link
          href="/applications/new"
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          신청서 작성
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              statusFilter === f.key
                ? "bg-[var(--primary)] text-white border-transparent shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {["접수번호", "기술명", "이전 유형", "특허번호", "상태", "신청일"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-16">
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
                <td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-sm">신청 내역이 없습니다.</span>
                  </div>
                </td>
              </tr>
            )}
            {data?.map((app: any) => (
              <tr key={app.id} className="table-row cursor-pointer animate-fade-in">
                <td className="px-5 py-4">
                  <span className="font-mono text-xs font-semibold text-[var(--primary)] bg-blue-50 px-2 py-1 rounded">
                    {app.application_no}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-slate-700 max-w-[200px] truncate">
                  {app.technology_name}
                </td>
                <td className="px-5 py-4 text-slate-500">{app.transfer_type}</td>
                <td className="px-5 py-4 text-slate-500 font-mono text-xs">{app.patent_no ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`badge ${STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-400 text-xs">
                  {new Date(app.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {data && data.length > 0 && (
        <p className="text-xs text-slate-400 text-right">총 {data.length}건</p>
      )}
    </div>
  );
}
