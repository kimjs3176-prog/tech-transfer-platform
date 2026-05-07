"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalApi } from "@/lib/api";

interface Props {
  contractId: number;
  currentStep: string | null;
  userRole: string;
}

function ActionTextarea({
  value,
  onChange,
  placeholder,
  focusColor,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  focusColor: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder={placeholder}
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 ${focusColor} resize-none placeholder:text-slate-400`}
    />
  );
}

export default function ApprovalActionPanel({ contractId, currentStep, userRole }: Props) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [opinion, setOpinion] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["workflow", contractId] });

  const startMut = useMutation({
    mutationFn: () => approvalApi.startWorkflow(contractId),
    onSuccess: invalidate,
  });

  const opinionMut = useMutation({
    mutationFn: () => approvalApi.submitInventorOpinion(contractId, opinion),
    onSuccess: () => { invalidate(); setOpinion(""); },
  });

  const reviewMut = useMutation({
    mutationFn: (result: "approved" | "rejected") =>
      approvalApi.review(contractId, result, comment),
    onSuccess: () => { invalidate(); setComment(""); },
  });

  const deptMut = useMutation({
    mutationFn: (result: "approved" | "rejected") =>
      approvalApi.deptApproval(contractId, result, comment),
    onSuccess: () => { invalidate(); setComment(""); },
  });

  if (!currentStep && userRole === "manager") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium">결재 워크플로가 시작되지 않았습니다.</p>
        </div>
        <button
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
          className="btn-primary w-full justify-center flex items-center gap-2"
        >
          {startMut.isPending ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          {startMut.isPending ? "시작 중..." : "결재 워크플로 시작"}
        </button>
      </div>
    );
  }

  if (currentStep === "inventor_opinion" && userRole === "inventor") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
        <p className="font-medium text-blue-800 text-sm">발명자 의견을 작성해주세요</p>
        <ActionTextarea
          value={opinion}
          onChange={setOpinion}
          placeholder="기술이전 조건(실시료, 계약기간 등)에 대한 의견을 작성하세요..."
          focusColor="focus:ring-blue-200"
        />
        <button
          onClick={() => opinionMut.mutate()}
          disabled={!opinion.trim() || opinionMut.isPending}
          className="w-full py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
        >
          {opinionMut.isPending ? "제출 중..." : "의견 제출"}
        </button>
      </div>
    );
  }

  if (currentStep === "opinion_review" && userRole === "manager") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
        <p className="font-medium text-amber-800 text-sm">발명자 의견을 검토해주세요</p>
        <ActionTextarea
          value={comment}
          onChange={setComment}
          placeholder="검토 의견 (선택)"
          focusColor="focus:ring-amber-200"
        />
        <div className="flex gap-2">
          <button
            onClick={() => reviewMut.mutate("approved")}
            disabled={reviewMut.isPending}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            부서장 결재 요청
          </button>
          <button
            onClick={() => reviewMut.mutate("rejected")}
            disabled={reviewMut.isPending}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
          >
            반려
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "dept_head" && userRole === "dept_head") {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 space-y-3">
        <p className="font-medium text-purple-800 text-sm">최종 결재를 진행해주세요</p>
        <ActionTextarea
          value={comment}
          onChange={setComment}
          placeholder="결재 의견 (선택)"
          focusColor="focus:ring-purple-200"
        />
        <div className="flex gap-2">
          <button
            onClick={() => deptMut.mutate("approved")}
            disabled={deptMut.isPending}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            결재 승인
          </button>
          <button
            onClick={() => deptMut.mutate("rejected")}
            disabled={deptMut.isPending}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            반려
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-emerald-700 font-medium text-sm">결재가 완료되었습니다</p>
        <p className="text-xs text-emerald-600 mt-1">계약서 등록이 완료되어 출력 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
      현재 단계의 처리 권한이 없습니다.
    </div>
  );
}
