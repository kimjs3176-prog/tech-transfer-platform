"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";

interface MenuItem {
  href: string;
  label: string;
}

interface MenuSection {
  key: string;
  icon: string;
  label: string;
  items: MenuItem[];
}

const MENU: MenuSection[] = [
  {
    key: "companies",
    icon: "🏢",
    label: "업체정보관리",
    items: [
      { href: "/companies", label: "업체 목록" },
      { href: "/companies/new", label: "업체 등록" },
    ],
  },
  {
    key: "applications",
    icon: "📋",
    label: "신청접수관리",
    items: [
      { href: "/applications", label: "신청 목록" },
      { href: "/applications/new", label: "신청서 작성" },
      { href: "/applications?status=RECEIVED", label: "접수 처리" },
      { href: "/applications?status=REVIEWING", label: "검토 중" },
      { href: "/applications?status=PATENT_CHECK", label: "특허청 확인" },
    ],
  },
  {
    key: "contracts",
    icon: "📝",
    label: "계약서관리",
    items: [
      { href: "/contracts", label: "계약 목록" },
      { href: "/contracts?status=DRAFT", label: "작성 중" },
      { href: "/contracts?status=REGISTERED", label: "등록 완료" },
      { href: "/contracts?status=PUBLISHED", label: "출력 완료" },
    ],
  },
  {
    key: "post",
    icon: "📈",
    label: "사후관리",
    items: [
      { href: "/post/tech-fees", label: "기술료 정산" },
      { href: "/post/reports", label: "실적 보고" },
      { href: "/post/status", label: "기술실시 현황" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // 현재 경로에 해당하는 섹션을 초기 오픈 상태로
  const defaultOpen = MENU.reduce<Record<string, boolean>>((acc, section) => {
    const active = section.items.some((item) => pathname.startsWith(item.href.split("?")[0]));
    acc[section.key] = active || section.key === "applications";
    return acc;
  }, {});
  const [open, setOpen] = useState<Record<string, boolean>>(defaultOpen);

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    const search = href.includes("?") ? href.split("?")[1] : null;
    if (!pathname.startsWith(base)) return false;
    if (!search) return pathname === base || (base !== "/" && pathname.startsWith(base));
    return true; // query-based items: highlight if path matches
  };

  return (
    <aside className="w-52 min-h-screen bg-[var(--primary)] text-white flex flex-col shrink-0">
      {/* 로고 */}
      <Link href="/dashboard" className="block p-4 border-b border-white/20 hover:bg-white/5">
        <p className="text-[10px] text-white/60 font-medium tracking-wider">NATI · 한국농업기술진흥원</p>
        <p className="font-bold text-sm mt-0.5 leading-tight">기술이전계약<br/>관리시스템</p>
      </Link>

      {/* 대시보드 */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b border-white/10 transition-colors ${
          pathname === "/dashboard" ? "bg-white/20 font-semibold" : "hover:bg-white/10"
        }`}
      >
        <span>📊</span>
        <span>대시보드</span>
      </Link>

      {/* 4개 섹션 메뉴 */}
      <nav className="flex-1 overflow-y-auto">
        {MENU.map((section) => (
          <div key={section.key} className="border-b border-white/10">
            {/* 섹션 헤더 */}
            <button
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </span>
              <span className={`text-xs transition-transform duration-200 ${open[section.key] ? "rotate-90" : ""}`}>
                ▶
              </span>
            </button>

            {/* 서브 메뉴 */}
            {open[section.key] && (
              <div className="bg-black/20 pb-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs transition-colors ${
                      isActive(item.href)
                        ? "bg-white/25 font-semibold text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="p-3 border-t border-white/20 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
            {(user?.name ?? "U")[0]}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{user?.name ?? "사용자"}</p>
            <p className="text-white/60 text-[10px] truncate">{user?.organization ?? ""}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left text-white/50 hover:text-white text-[10px] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
