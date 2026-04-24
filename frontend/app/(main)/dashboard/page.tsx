"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const appChartData = data
    ? [
        { name: "점수 대기", value: data.applications.waiting },
        { name: "접수", value: data.applications.received },
        { name: "반려", value: data.applications.rejected },
      ]
    : [];

  const contractChartData = data
    ? [
        { name: "작성 중", value: data.contracts.draft },
        { name: "등록", value: data.contracts.registered },
        { name: "출력 완료", value: data.contracts.published },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--primary)]">대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "전체 신청", value: data?.applications.total ?? "-", color: "bg-blue-50 border-blue-200" },
          { label: "반려", value: data?.applications.rejected ?? "-", color: "bg-red-50 border-red-200" },
          { label: "계약 등록", value: data?.contracts.registered ?? "-", color: "bg-green-50 border-green-200" },
          { label: "계약서 출력", value: data?.contracts.published ?? "-", color: "bg-yellow-50 border-yellow-200" },
        ].map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-4">신청 현황</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={appChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1a6b3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-4">계약 현황</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contractChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#e85d2f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
