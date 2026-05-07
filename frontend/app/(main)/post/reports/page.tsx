"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

const HALF_LABELS = ["", "상반기", "하반기"];
const YEAR = new Date().getFullYear();

export default function ReportsPage() {
  const [yearFilter, setYearFilter] = useState(YEAR);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", yearFilter],
    queryFn: () => api.get("/performance-reports/", { params: { year: yearFilter } }).then((r) => r.data),
  });

  const totalRoyalty = data?.reduce((s: number, r: any) => s + (Number(r.royalty_amount) || 0), 0) ?? 0;
  const totalSales = data?.reduce((s: number, r: any) => s + (Number(r.sales_amount) || 0), 0) ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--primary)]">실적 보고</h1>
          <p className="text-xs text-gray-500 mt-0.5">연도별 기술실시 실적을 조회합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">보고연도</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="border rounded px-2 py-1.5 text-sm"
          >
            {[YEAR, YEAR - 1, YEAR - 2, YEAR - 3].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <Link href="/post/tech-fees" className="bg-[var(--primary)] text-white px-3 py-1.5 rounded text-sm hover:opacity-90">
            + 실적 등록
          </Link>
        </div>
      </div>

      {/* 연도 합계 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">{yearFilter}년 총 매출액</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalSales.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">{yearFilter}년 총 기술료</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{totalRoyalty.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
        </div>
      </div>

      {/* 반기별 현황 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((half) => {
          const halfData = data?.filter((r: any) => r.report_half === half) ?? [];
          const halfRoyalty = halfData.reduce((s: number, r: any) => s + (Number(r.royalty_amount) || 0), 0);
          const halfSales = halfData.reduce((s: number, r: any) => s + (Number(r.sales_amount) || 0), 0);
          return (
            <div key={half} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{HALF_LABELS[half]}</h3>
                <span className="text-xs text-gray-400">{halfData.length}건</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">매출액</span>
                  <span className="font-medium">{halfSales.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">기술료</span>
                  <span className="font-medium text-green-700">{halfRoyalty.toLocaleString()}원</span>
                </div>
                {halfSales > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>기술료율</span>
                    <span>{((halfRoyalty / halfSales) * 100).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["계약번호", "반기", "매출액", "실시료", "기술료율", "보고일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>}
            {!isLoading && (!data || data.length === 0) && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">{yearFilter}년 실적 보고가 없습니다.</td></tr>
            )}
            {data?.map((r: any) => {
              const sales = Number(r.sales_amount) || 0;
              const royalty = Number(r.royalty_amount) || 0;
              return (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">계약 #{r.contract_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.report_half === 1 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                      {HALF_LABELS[r.report_half]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{sales.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{royalty.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {sales > 0 ? ((royalty / sales) * 100).toFixed(2) + "%" : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.report_date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
