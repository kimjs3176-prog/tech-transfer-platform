"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";

const DONUT_COLORS = ["#2563eb", "#22c55e", "#8b5cf6"];

function StatCard({
  label,
  value,
  badge,
  badgeColor,
  icon,
  iconBg,
  trend,
}: {
  label: string;
  value: number | string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {trend && (
            <span className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusCard({ data }: { data: any }) {
  const waiting = data?.applications?.waiting ?? 0;
  const reviewing = data?.applications?.received ?? 0;
  const approved = data?.applications?.approved ?? 0;
  const total = waiting + reviewing + approved || 1;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">신청 현황</h2>
        <button className="text-slate-400 hover:text-slate-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      {/* Waiting */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-600 font-medium">점수 대기</span>
          <span className="text-sm font-semibold text-[var(--primary)]">{waiting} 건</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${(waiting / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Status rows */}
      {[
        { label: "검토 중", value: reviewing, color: "text-amber-600" },
        { label: "승인 완료", value: approved, color: "text-emerald-600" },
      ].map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2.5 border-t border-slate-100">
          <span className="text-sm text-slate-500">{row.label}</span>
          <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
        </div>
      ))}

      {/* Info box */}
      {data?.latest_application_no && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex gap-2.5 items-start">
          <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 15v-4m0-4h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <p className="text-xs text-blue-700">
            신청서 <span className="font-semibold">{data.latest_application_no}</span>이(가) 현재 초기 심사 단계에 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function ContractStatusCard({ data }: { data: any }) {
  const inProgress = data?.contracts?.draft ?? 0;
  const registered = data?.contracts?.registered ?? 0;
  const printed = data?.contracts?.published ?? 0;
  const total = inProgress + registered + printed;

  const chartData = [
    { name: "진행 중", value: inProgress || 0.001 },
    { name: "등록", value: registered || 0.001 },
    { name: "출력 완료", value: printed || 0.001 },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">계약 현황</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">● 활성</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={DONUT_COLORS[index]} opacity={total === 0 ? 0.2 : 1} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [Math.round(v), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            <p className="text-xs text-slate-400">TOTAL</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {[
            { label: "진행 중", value: inProgress, color: "#2563eb", dot: "bg-[#2563eb]" },
            { label: "등록", value: registered, color: "#22c55e", dot: "bg-[#22c55e]" },
            { label: "출력 완료", value: printed, color: "#8b5cf6", dot: "bg-[#8b5cf6]" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <span className="text-xs text-slate-600">{item.label}</span>
              </div>
              <span className="text-xs text-slate-400">{item.value} 건</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          다음 갱신: <span className="text-slate-700 font-medium">예정 없음</span>
        </p>
        <Link href="/contracts" className="text-xs text-[var(--primary)] font-medium hover:underline">
          전체 계약 보기 →
        </Link>
      </div>
    </div>
  );
}

function AiReportPopup() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 right-8 w-64 bg-slate-800 rounded-2xl shadow-2xl p-4 text-white animate-fade-in z-50">
      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-blue-400">New: AI Report</span>
      </div>
      <p className="text-sm font-medium mb-1">AI 특허 분석 리포트</p>
      <p className="text-xs text-slate-400 mb-3">
        새로운 AI 엔진으로 자동화된 특허 현황 보고서를 생성하세요.
      </p>
      <button className="w-full py-2 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors">
        AI 엔진 사용해 보기
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const stats = [
    {
      label: "전체 신청",
      value: data?.applications?.total ?? 0,
      badge: "+12% ↑",
      badgeColor: "bg-emerald-50 text-emerald-600",
      trend: "12%",
      iconBg: "bg-blue-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: "심사 대기",
      value: data?.applications?.waiting ?? 0,
      badge: "Steady",
      badgeColor: "bg-orange-50 text-orange-500",
      iconBg: "bg-orange-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "계약 등록",
      value: data?.contracts?.registered ?? 0,
      badge: "New",
      badgeColor: "bg-emerald-50 text-emerald-600",
      iconBg: "bg-emerald-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      label: "계약서 출력",
      value: data?.contracts?.published ?? 0,
      badge: "Ready",
      badgeColor: "bg-purple-50 text-purple-600",
      iconBg: "bg-purple-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            안녕하세요, {user?.name ?? "사용자"}님 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">오늘의 기술이전 현황을 확인하세요.</p>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ApplicationStatusCard data={data} />
        <ContractStatusCard data={data} />
      </div>

      {/* Help section */}
      <div className="card p-6 flex items-center gap-6">
        <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-700">라이선싱 지원이 필요하신가요?</p>
          <p className="text-sm text-slate-500 mt-1">
            전문 컨설턴트가 1:1 상담을 통해 등록 절차를 안내해 드립니다.
          </p>
        </div>
        <button className="flex-shrink-0 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors">
          컨설턴트 예약
        </button>
      </div>

      {/* AI Report popup */}
      <AiReportPopup />
    </div>
  );
}
