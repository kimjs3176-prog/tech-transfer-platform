"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { approvalApi, contractApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import ApprovalActionPanel from "@/components/approval/ApprovalActionPanel";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  draft:           "계약서 작성 중",
  inventor_review: "발명자 의견 대기",
  dept_approval:   "부서장 결재 대기",
  registered:      "계약서 등록 완료",
  published:       "계약서 출력 완료",
};

const STATUS_COLORS: Record<string, string> = {
  draft:           "bg-gray-100 text-gray-700",
  inventor_review: "bg-blue-100 text-blue-700",
  dept_approval:   "bg-purple-100 text-purple-700",
  registered:      "bg-green-100 text-green-700",
  published:       "bg-emerald-100 text-emerald-700",
};

export default function ApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const contractId = parseInt(id);
  const { user } = useAuthStore();

  const { data: contract } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => contractApi.get(contractId).then((r) => r.data),
  });

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", contractId],
    queryFn: () => approvalApi.getWorkflow(contractId).then((r) => r.data),
    refetchInterval: 10_000, // 10초마다 자동 갱신
  });

  if (isLoading) {
    return <div className="p-6 text-gray-400">결재 정보를 불러오는 중...</div>;
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/contracts" className="text-sm text-gray-400 hover:text-gray-600">
            ← 계약 목록
          </Link>
          <h1 className="text-2xl font-bold text-[var(--primary)] mt-1">결재 워크플로</h1>
          <p className="text-gray-500 text-sm">{contract?.contract_no}</p>
        </div>
        {workflow && (
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[workflow.contract_status] ?? "bg-gray-100"}`}>
            {STATUS_LABELS[workflow.contract_status] ?? workflow.contract_status}
          </span>
        )}
      </div>

      {/* 계약 요약 */}
      {contract && (
        <div className="bg-white rounded-lg border p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">계약번호</span>
            <p className="font-mono font-medium">{contract.contract_no}</p>
          </div>
          <div>
            <span className="text-gray-500">계약기간</span>
            <p className="font-medium">
              {contract.contract_period_start
                ? `${contract.contract_period_start} ~ ${contract.contract_period_end}`
                : "미설정"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">실시료율</span>
            <p className="font-medium">{contract.royalty_rate ? `${contract.royalty_rate}%` : "-"}</p>
          </div>
          <div>
            <span className="text-gray-500">일시불</span>
            <p className="font-medium">
              {contract.lump_sum ? `${Number(contract.lump_sum).toLocaleString()}원` : "-"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 타임라인 */}
        <div className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold text-gray-700 mb-5">결재 진행 현황</h2>
          {workflow?.steps?.length ? (
            <ApprovalTimeline steps={workflow.steps} currentStep={workflow.current_step} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              결재 워크플로가 아직 시작되지 않았습니다.
            </p>
          )}
        </div>

        {/* 액션 패널 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">내 처리 항목</h2>
            <ApprovalActionPanel
              contractId={contractId}
              currentStep={workflow?.current_step ?? null}
              userRole={user?.role ?? ""}
            />
          </div>

          {/* 처리 통계 */}
          {workflow?.steps && (
            <div className="bg-white rounded-lg border p-4 text-sm">
              <h3 className="font-medium text-gray-600 mb-3">단계별 현황</h3>
              <div className="space-y-2">
                {workflow.steps.map((step: any) => (
                  <div key={step.step} className="flex items-center justify-between">
                    <span className="text-gray-600">{step.step_label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${step.result === "approved" ? "bg-green-100 text-green-700"
                        : step.result === "rejected" ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"}`}>
                      {step.result === "approved" ? "완료" : step.result === "rejected" ? "반려" : "대기"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
