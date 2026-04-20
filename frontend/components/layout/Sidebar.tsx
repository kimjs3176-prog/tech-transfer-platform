"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "대시보드", icon: "📊" },
  { href: "/applications", label: "신청 관리", icon: "📋" },
  { href: "/contracts", label: "계약 관리", icon: "📝" },
  { href: "/reports", label: "실적 보고", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-56 min-h-screen bg-[var(--primary)] text-white flex flex-col">
      <div className="p-5 border-b border-white/20">
        <p className="text-xs text-white/70">한국농업기술진흥원</p>
        <p className="font-bold text-sm mt-0.5">기술이전계약관리</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-white/20 font-medium"
                : "hover:bg-white/10"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/20 text-xs">
        <p className="text-white/70">{user?.organization ?? ""}</p>
        <p className="font-medium">{user?.name ?? "사용자"}</p>
        <button onClick={logout} className="mt-2 text-white/60 hover:text-white">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
