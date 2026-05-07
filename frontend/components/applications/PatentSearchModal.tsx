"use client";
import { useState, useCallback } from "react";
import { patentApi } from "@/lib/api";

export interface PatentResult {
  application_number: string | null;
  registration_number: string | null;
  title: string;
  applicant: string;
  inventors: string[];
  inventors_raw: string;
  application_date: string | null;
  registration_date: string | null;
  ipc: string;
  abstract: string;
}

interface Props {
  onSelect: (patent: PatentResult) => void;
  onClose: () => void;
}

export default function PatentSearchModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatentResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await patentApi.search(query.trim());
      setResults(res.data.results ?? []);
      setTotal(res.data.total ?? 0);
      if (res.data.error) setError(res.data.error);
    } catch {
      setError("특허 검색 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">KIPRIS 특허 검색</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="발명의 명칭 또는 출원번호 입력..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : null}
              검색
            </button>
          </div>
        </div>

        {/* 결과 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {error && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {!searched && !loading && (
            <div className="text-center py-12 text-slate-400">
              <svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-sm">발명의 명칭을 입력 후 검색하세요.</p>
            </div>
          )}
          {searched && !loading && results.length === 0 && !error && (
            <div className="text-center py-12 text-slate-400 text-sm">
              검색 결과가 없습니다.
            </div>
          )}
          {results.length > 0 && (
            <p className="text-xs text-slate-400 mb-1">총 {total.toLocaleString()}건 (최대 10건 표시)</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r); onClose(); }}
              className="w-full text-left border border-slate-200 rounded-xl p-3.5 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700">
                    {r.title || "—"}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {r.application_number && (
                      <span className="text-xs text-slate-500">출원: <span className="font-mono">{r.application_number}</span></span>
                    )}
                    {r.registration_number && (
                      <span className="text-xs text-slate-500">등록: <span className="font-mono">{r.registration_number}</span></span>
                    )}
                    {r.applicant && (
                      <span className="text-xs text-slate-500">출원인: {r.applicant}</span>
                    )}
                  </div>
                  {r.inventors.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.inventors.map((name) => (
                        <span key={name} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <svg className="flex-shrink-0 mt-0.5 text-slate-300 group-hover:text-blue-500 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          선택하면 특허 정보가 폼에 자동으로 입력됩니다.
        </div>
      </div>
    </div>
  );
}
