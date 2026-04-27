"use client";
import { useState, useEffect } from "react";
import { userApi } from "@/lib/api";

interface UserResult {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  role: string;
}

interface Props {
  kiprisInventors: string[];   // KIPRIS에서 가져온 발명자 이름 목록
  onAssign: (user: UserResult) => void;
}

export default function InventorSearchPanel({ kiprisInventors, onAssign }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);

  // KIPRIS 발명자 목록이 들어오면 자동 검색
  useEffect(() => {
    if (kiprisInventors.length > 0 && !autoSearched) {
      setAutoSearched(true);
      searchByKipris();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiprisInventors]);

  const searchByKipris = async () => {
    if (kiprisInventors.length === 0) return;
    setLoading(true);
    try {
      const res = await userApi.searchInventors(kiprisInventors.join(","));
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByName = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await userApi.search(query.trim(), "INVENTOR");
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* KIPRIS 발명자 태그 */}
      {kiprisInventors.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <span className="text-[10px] text-blue-500 font-medium w-full mb-0.5">KIPRIS 발명인</span>
          {kiprisInventors.map((name) => (
            <span key={name} className="text-[10px] bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 이름 검색 */}
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchByName()}
          placeholder="이름으로 회원 검색..."
          className="flex-1 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
        <button
          type="button"
          onClick={searchByName}
          disabled={loading}
          className="bg-[var(--primary)] text-white px-2 py-0.5 rounded text-[10px] hover:opacity-90 disabled:opacity-50"
        >
          검색
        </button>
        {kiprisInventors.length > 0 && (
          <button
            type="button"
            onClick={searchByKipris}
            disabled={loading}
            className="bg-blue-50 border border-blue-300 text-blue-700 px-2 py-0.5 rounded text-[10px] hover:bg-blue-100 disabled:opacity-50"
          >
            특허 발명인 재검색
          </button>
        )}
      </div>

      {/* 검색 결과 */}
      {loading && (
        <div className="text-[10px] text-slate-400 flex items-center gap-1 py-1">
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          검색 중...
        </div>
      )}
      {!loading && results.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onAssign(u)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
            >
              <div>
                <span className="text-xs font-medium text-slate-700">{u.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">{u.organization ?? ""}</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">배정</span>
            </button>
          ))}
        </div>
      )}
      {!loading && autoSearched && results.length === 0 && (
        <p className="text-[10px] text-slate-400">일치하는 가입 회원이 없습니다.</p>
      )}
    </div>
  );
}
