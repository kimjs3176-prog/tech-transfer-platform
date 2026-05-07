"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { approvalApi, contractApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import ApprovalActionPanel from "@/components/approval/ApprovalActionPanel";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "계약서 작성 중",
  INVENTOR_REVIEW: "발명자 의견 대기",
  DEPT_APPROVAL: "부서장 결재 대기",
  REGISTERED: "계약서 등록 완료",
  PUBLISHED: "계약서 출력 완료",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  INVENTOR_REVIEW: "bg-blue-50 text-blue-600",
  DEPT_APPROVAL: "bg-purple-50 text-purple-600",
  REGISTERED: "bg-emerald-50 text-emerald-600",
  PUBLISHED: "bg-green-50 text-green-700",
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
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-3 text-slate-400">
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        결재 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/contracts"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            계약 목록
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">결재 워크플로</h1>
          <p className="text-sm text-slate-400 mt-0.5">{contract?.contract_no}</p>
        </div>
        {workflow && (
          <span className={`badge text-sm px-3 py-1 ${STATUS_COLORS[workflow.contract_status] ?? "bg-slate-100 text-slate-500"}`}>
            {STATUS_LABELS[workflow.contract_status] ?? workflow.contract_status}
          </span>
        )}
      </div>

      {/* Contract info card */}
      {contract && (
        <div className="card p-5 grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "계약번호", value: contract.contract_no, mono: true },
            {
              label: "계약기간",
              value: contract.contract_period_start
                ? `${contract.contract_period_start} ~ ${contract.contract_period_end}`
                : "미설정",
            },
            { label: "실시료율", value: contract.royalty_rate ? `${contract.royalty_rate}%` : "—" },
            {
              label: "일시불",
              value: contract.lump_sum ? `${Number(contract.lump_sum).toLocaleString()}원` : "—",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
              <p className={`font-medium text-slate-700 ${item.mono ? "font-mono text-xs" : ""}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Timeline + Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-5">결재 진행 현황</h2>
          {workflow?.steps?.length ? (
            <ApprovalTimeline steps={workflow.steps} currentStep={workflow.current_step} />
          ) : (
            <div className="text-center py-10 text-slate-400">
              <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm">결재 워크플로가 아직 시작되지 않았습니다.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-700 mb-4">내 처리 항목</h2>
            <ApprovalActionPanel
              contractId={contractId}
              currentStep={workflow?.current_step ?? null}
              userRole={user?.role ?? ""}
            />
          </div>

          {workflow?.steps && (
            <div className="card p-4 text-sm">
              <h3 className="font-medium text-slate-600 mb-3">단계별 현황</h3>
              <div className="space-y-2">
                {workflow.steps.map((step: any) => (
                  <div key={step.step} className="flex items-center justify-between py-1">
                    <span className="text-slate-600">{step.step_label}</span>
                    <span className={`badge text-xs ${
                      step.result === "APPROVED"
                        ? "bg-emerald-50 text-emerald-600"
                        : step.result === "REJECTED"
                        ? "bg-red-50 text-red-500"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {step.result === "APPROVED" ? "완료" : step.result === "REJECTED" ? "반려" : "대기"}
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
