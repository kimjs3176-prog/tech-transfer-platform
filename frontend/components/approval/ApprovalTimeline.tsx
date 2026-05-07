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

const STEP_ICONS: Record<string, React.ReactNode> = {
  inventor_opinion: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  opinion_review: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  dept_head: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  final: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function ApprovalTimeline({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: string | null;
}) {
  return (
    <ol className="relative ml-3 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

      {steps.map((step, idx) => {
        const isActive = step.step === currentStep;
        const isDone = step.result !== "pending";
        const isApproved = step.result === "approved";

        return (
          <li key={step.step} className="relative pl-10 pb-6 last:pb-0">
            {/* Dot */}
            <span
              className={`absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs z-10 transition-all
                ${isDone
                  ? isApproved
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-red-500 border-red-500 text-white"
                  : isActive
                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
            >
              {isDone ? (
                isApproved ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )
              ) : (
                <span className="text-current">{STEP_ICONS[step.step] ?? (idx + 1)}</span>
              )}
              {isActive && !isDone && (
                <span className="absolute inset-0 rounded-full border-2 border-[var(--primary)] animate-ping opacity-40" />
              )}
            </span>

            {/* Card */}
            <div
              className={`rounded-xl border p-4 transition-all ${
                isActive && !isDone
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : isDone && isApproved
                  ? "border-emerald-100 bg-emerald-50/40"
                  : isDone
                  ? "border-red-100 bg-red-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-700">{step.step_label}</span>
                  {isActive && !isDone && (
                    <span className="bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded-full">
                      진행 중
                    </span>
                  )}
                </div>
                <span
                  className={`badge text-xs ${
                    isDone
                      ? isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? (isApproved ? "승인" : "반려") : "대기"}
                </span>
              </div>

              {step.comment && (
                <p className="mt-2.5 text-sm text-slate-600 bg-white rounded-lg p-2.5 border border-slate-200 border-l-4 border-l-slate-400">
                  {step.comment}
                </p>
              )}

              {step.processed_at && (
                <p className="mt-1.5 text-xs text-slate-400">
                  처리: {new Date(step.processed_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
