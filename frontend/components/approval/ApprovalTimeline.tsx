"use client";

interface Step {
  step: string;
  step_label: string;
  step_order: number;
  result: "pending" | "approved" | "rejected";
  comment: string | null;
  processed_at: string | null;
  approver_id: number | null;
}

const ICONS: Record<string, string> = {
  inventor_opinion: "✍️",
  opinion_review:   "🔍",
  dept_head:        "📋",
  final:            "✅",
};

const RESULT_STYLE: Record<string, string> = {
  pending:  "bg-gray-100 border-gray-300 text-gray-500",
  approved: "bg-green-100 border-green-400 text-green-700",
  rejected: "bg-red-100 border-red-400 text-red-700",
};

const RESULT_LABEL: Record<string, string> = {
  pending:  "대기",
  approved: "승인",
  rejected: "반려",
};

export default function ApprovalTimeline({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: string | null;
}) {
  return (
    <ol className="relative border-l-2 border-gray-200 ml-4 space-y-0">
      {steps.map((step, idx) => {
        const isActive = step.step === currentStep;
        const isDone = step.result !== "pending";

        return (
          <li key={step.step} className="ml-6 pb-8 last:pb-0">
            {/* 타임라인 도트 */}
            <span
              className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm
                ${isDone
                  ? step.result === "approved"
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-red-500 border-red-500 text-white"
                  : isActive
                    ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
            >
              {isDone ? (step.result === "approved" ? "✓" : "✗") : idx + 1}
            </span>

            {/* 카드 */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                isActive ? "shadow-md border-blue-300 bg-blue-50" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ICONS[step.step]}</span>
                  <span className="font-medium text-sm">{step.step_label}</span>
                  {isActive && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      진행 중
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border font-medium ${RESULT_STYLE[step.result]}`}
                >
                  {RESULT_LABEL[step.result]}
                </span>
              </div>

              {step.comment && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2 border-l-2 border-gray-300">
                  {step.comment}
                </p>
              )}

              {step.processed_at && (
                <p className="mt-1 text-xs text-gray-400">
                  처리일시: {new Date(step.processed_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
