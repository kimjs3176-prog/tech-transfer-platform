"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CompaniesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["companies", search],
    queryFn: () => api.get("/companies/", { params: { keyword: search || undefined } }).then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--primary)]">업체정보관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">기술이전을 신청한 기업 정보를 관리합니다.</p>
        </div>
        <button
          onClick={() => router.push("/companies/new")}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          + 업체 등록
        </button>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearch(keyword)}
          placeholder="업체명으로 검색..."
          className="border rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          onClick={() => setSearch(keyword)}
          className="bg-gray-100 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-200"
        >
          검색
        </button>
        {search && (
          <button
            onClick={() => { setSearch(""); setKeyword(""); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              {["번호", "업체명", "사업자등록번호", "대표자", "업태/업종", "연락처", "등록일", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">등록된 업체가 없습니다.</td></tr>
            )}
            {data?.map((c: any, i: number) => (
              <tr
                key={c.id}
                className="border-b hover:bg-blue-50 cursor-pointer"
                onClick={() => router.push(`/companies/${c.id}`)}
              >
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--primary)]">{c.company_name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.business_reg_no ?? "-"}</td>
                <td className="px-4 py-3 text-gray-600">{c.representative ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {[c.biz_type, c.industry].filter(Boolean).join(" / ") || "-"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.company_phone ?? "-"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/companies/${c.id}`)}
                      className="text-xs text-blue-600 hover:underline"
                    >수정</button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => confirm("삭제하시겠습니까?") && deleteMut.mutate(c.id)}
                      className="text-xs text-red-400 hover:underline"
                    >삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {data?.length ?? 0}개 업체</p>
    </div>
  );
}
