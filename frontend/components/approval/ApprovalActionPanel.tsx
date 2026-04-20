"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalApi } from "@/lib/api";

interface Props {
  contractId: number;
  currentStep: string | null;
  userRole: string;
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

  // 워크플로 미시작
  if (!currentStep && userRole === "manager") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-700 mb-3">결재 워크플로가 시작되지 않았습니다.</p>
        <button
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          {startMut.isPending ? "시작 중..." : "결재 워크플로 시작"}
        </button>
      </div>
    );
  }

  // 1단계: 발명자 의견 작성
  if (currentStep === "inventor_opinion" && userRole === "inventor") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <p className="font-medium text-blue-800">발명자 의견을 작성해주세요</p>
        <textarea
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          rows={5}
          placeholder="기술이전 조건(실시료, 계약기간 등)에 대한 의견을 작성하세요..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => opinionMut.mutate()}
          disabled={!opinion.trim() || opinionMut.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          {opinionMut.isPending ? "제출 중..." : "의견 제출"}
        </button>
      </div>
    );
  }

  // 2단계: 담당자 의견 검토
  if (currentStep === "opinion_review" && userRole === "manager") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
        <p className="font-medium text-yellow-800">발명자 의견을 검토해주세요</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="검토 의견 (선택)"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => reviewMut.mutate("approved")}
            disabled={reviewMut.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            부서장 결재 요청
          </button>
          <button
            onClick={() => reviewMut.mutate("rejected")}
            disabled={reviewMut.isPending}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            발명자에게 반려
          </button>
        </div>
      </div>
    );
  }

  // 3단계: 부서장 결재
  if (currentStep === "dept_head" && userRole === "dept_head") {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
        <p className="font-medium text-purple-800">최종 결재를 진행해주세요</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="결재 의견 (선택)"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => deptMut.mutate("approved")}
            disabled={deptMut.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            ✓ 결재 승인
          </button>
          <button
            onClick={() => deptMut.mutate("rejected")}
            disabled={deptMut.isPending}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            ✗ 반려
          </button>
        </div>
      </div>
    );
  }

  // 완료 상태
  if (!currentStep) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">✅ 결재가 완료되었습니다</p>
        <p className="text-sm text-green-600 mt-1">계약서 등록이 완료되어 출력 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-500 text-center">
      현재 단계의 처리 권한이 없습니다.
    </div>
  );
}
