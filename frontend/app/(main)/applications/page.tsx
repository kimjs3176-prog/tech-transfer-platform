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
  WAITING: "bg-gray-100 text-gray-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["applications", statusFilter],
    queryFn: () =>
      applicationApi.list({ status: statusFilter || undefined }).then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--primary)]">신청 관리</h1>
        <Link
          href="/applications/new"
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm"
        >
          + 신청서 작성
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "WAITING", "RECEIVED", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              statusFilter === s
                ? "bg-[var(--primary)] text-white border-transparent"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {s ? STATUS_LABELS[s] : "전체"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["접수번호", "기술명", "이전 유형", "특허번호", "상태", "신청일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  불러오는 중...
                </td>
              </tr>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  신청 내역이 없습니다.
                </td>
              </tr>
            )}
            {data?.map((app: any) => (
              <tr key={app.id} className="border-b hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{app.application_no}</td>
                <td className="px-4 py-3 font-medium">{app.technology_name}</td>
                <td className="px-4 py-3 text-gray-600">{app.transfer_type}</td>
                <td className="px-4 py-3 text-gray-600">{app.patent_no ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[app.status] ?? "bg-gray-100"}`}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(app.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
