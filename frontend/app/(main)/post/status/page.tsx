"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "작성 중", INVENTOR_REVIEW: "발명자 검토", DEPT_APPROVAL: "부서장 결재",
  REGISTERED: "등록 완료", PUBLISHED: "출력 완료",
};
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", INVENTOR_REVIEW: "bg-blue-100 text-blue-700",
  DEPT_APPROVAL: "bg-purple-100 text-purple-700", REGISTERED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

export default function StatusPage() {
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts-status"],
    queryFn: () => api.get("/contracts/").then((r) => r.data),
  });

  const { data: applications } = useQuery({
    queryKey: ["applications-status"],
    queryFn: () => api.get("/applications/").then((r) => r.data),
  });

  // 계약 상태 집계
  const contractSummary = contracts?.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--primary)]">기술실시 현황</h1>
        <p className="text-xs text-gray-500 mt-0.5">체결된 계약의 실시 현황을 조회합니다.</p>
      </div>

      {/* 계약 상태별 현황 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">계약 현황 요약</h2>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(CONTRACT_STATUS_LABELS).map(([status, label]) => (
            <div key={status} className={`rounded-lg border p-3 ${CONTRACT_STATUS_COLORS[status]}`}>
              <p className="text-xs opacity-80">{label}</p>
              <p className="text-2xl font-bold mt-1">{contractSummary[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 계약 목록 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">실시 계약 목록</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["계약번호", "상태", "계약기간", "실시료율", "일시불", "생성일", "실적보고"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contractsLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>}
              {!contractsLoading && (!contracts || contracts.length === 0) && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">계약 내역이 없습니다.</td></tr>
              )}
              {contracts?.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.contract_no}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${CONTRACT_STATUS_COLORS[c.status] ?? "bg-gray-100"}`}>
                      {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.contract_period_start ? `${c.contract_period_start} ~ ${c.contract_period_end}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-right">{c.royalty_rate != null ? `${c.royalty_rate}%` : "-"}</td>
                  <td className="px-4 py-3 text-gray-600 text-right">{c.lump_sum != null ? `${Number(c.lump_sum).toLocaleString()}원` : "-"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString("ko-KR")}</td>
                  <td className="px-4 py-3">
                    <a href={`/post/reports`} className="text-xs text-[var(--primary)] hover:underline">보고 내역 →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 신청 진행 현황 */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">신청 처리 현황</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["접수번호", "기술명", "이전 유형", "상태", "신청일"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!applications || applications.length === 0
                ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">신청 내역이 없습니다.</td></tr>
                : applications.slice(0, 10).map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{a.application_no}</td>
                    <td className="px-4 py-3 font-medium">{a.technology_name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.transfer_type}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString("ko-KR")}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
