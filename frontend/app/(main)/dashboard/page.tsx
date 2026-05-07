"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const { data: reportStats } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => api.get("/performance-reports/stats").then((r) => r.data),
  });

  const { data: companyStats } = useQuery({
    queryKey: ["company-stats"],
    queryFn: () => api.get("/companies/stats").then((r) => r.data),
  });

  const SUMMARY = [
    { label: "등록 업체", value: companyStats?.total ?? "-", color: "bg-indigo-50 border-indigo-200 text-indigo-700", href: "/companies", icon: "🏢" },
    { label: "전체 신청", value: data?.applications.total ?? "-", color: "bg-blue-50 border-blue-200 text-blue-700", href: "/applications", icon: "📋" },
    { label: "계약 등록", value: data?.contracts.registered ?? "-", color: "bg-green-50 border-green-200 text-green-700", href: "/contracts", icon: "📝" },
    { label: "총 기술료", value: reportStats ? `${(reportStats.total_royalty / 10000).toFixed(0)}만원` : "-", color: "bg-amber-50 border-amber-200 text-amber-700", href: "/post/tech-fees", icon: "💰" },
  ];

  const appChartData = data
    ? [
        { name: "점수 대기", value: data.applications.waiting, fill: "#93c5fd" },
        { name: "접수", value: data.applications.received, fill: "#60a5fa" },
        { name: "반려", value: data.applications.rejected, fill: "#f87171" },
      ]
    : [];

  const contractChartData = data
    ? [
        { name: "작성 중", value: data.contracts.draft, fill: "#d1d5db" },
        { name: "등록", value: data.contracts.registered, fill: "#34d399" },
        { name: "출력", value: data.contracts.published, fill: "#10b981" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--primary)]">대시보드</h1>
        <p className="text-xs text-gray-400">{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY.map((c) => (
          <Link key={c.label} href={c.href} className={`rounded-lg border p-4 ${c.color} hover:opacity-90 transition-opacity`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium opacity-70">{c.label}</p>
              <span className="text-lg">{c.icon}</span>
            </div>
            <p className="text-3xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>

      {/* 메뉴 바로가기 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/companies/new", label: "업체 등록", icon: "➕", desc: "신규 업체 등록" },
          { href: "/applications/new", label: "신청서 작성", icon: "📄", desc: "기술이전 신청" },
          { href: "/contracts", label: "계약 목록", icon: "🔍", desc: "계약서 조회" },
          { href: "/post/tech-fees", label: "기술료 정산", icon: "💳", desc: "실적 보고 등록" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white rounded-lg border p-3 hover:border-[var(--primary)] hover:shadow-sm transition-all group">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="font-semibold text-gray-700 text-sm group-hover:text-[var(--primary)]">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-700">신청 현황</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={appChartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {appChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-700">계약 현황</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={contractChartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {contractChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
