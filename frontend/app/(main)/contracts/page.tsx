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
  DRAFT: "bg-gray-100 text-gray-700",
  INVENTOR_REVIEW: "bg-blue-100 text-blue-700",
  DEPT_APPROVAL: "bg-purple-100 text-purple-700",
  REGISTERED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

export default function ContractsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractApi.list().then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--primary)]">계약 관리</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["계약번호", "상태", "계약기간", "실시료율", "일시불", "생성일", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  불러오는 중...
                </td>
              </tr>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  계약 내역이 없습니다.
                </td>
              </tr>
            )}
            {data?.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.contract_no}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[c.status] ?? "bg-gray-100"}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.contract_period_start
                    ? `${c.contract_period_start} ~ ${c.contract_period_end}`
                    : "-"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.royalty_rate != null ? `${c.royalty_rate}%` : "-"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.lump_sum != null ? `${Number(c.lump_sum).toLocaleString()}원` : "-"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/contracts/${c.id}/approval`}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    결재 현황 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
