"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { applicationApi } from "@/lib/api";

/* ───────────── 워크플로 스텝 ───────────── */
const STEPS = [
  { org: "농진원", label: "신청서접수" },
  { org: "소속기관", label: "발명자배정" },
  { org: "발명자", label: "의견작성" },
  { org: "소속기관", label: "의견검토" },
  { org: "소속기관", label: "부서장결재" },
  { org: "농진원", label: "특허청승인" },
  { org: "농진원", label: "계약서작성" },
  { org: "NATI", label: "계약서출력" },
  { org: "농진원", label: "계약서등록" },
  { org: "소속기관", label: "실적보고" },
];

/* ───────────── 유효성 스키마 ───────────── */
const schema = z.object({
  /* 관련특허정보 */
  ownership_type: z.string().default("국유_농진청"),
  ownership_status: z.enum(["출원", "등록"]).default("출원"),
  case_domestic: z.boolean().default(true),
  rights_type: z.string().default("특허"),
  receipt_no: z.string().optional(),
  application_no: z.string().optional(),
  registration_no: z.string().optional(),
  invention_institution: z.string().optional(),
  invention_title: z.string().min(1, "발명의 명칭을 입력하세요"),
  inventor_name: z.string().optional(),
  inventor_phone: z.string().optional(),
  applicant_org: z.string().optional(),
  registration_manager: z.string().optional(),

  /* 실시신청내용 */
  contract_type: z.enum(["신규", "재계약", "자동재계약"]).default("신규"),
  disposal_type: z.enum(["통상실시", "전용실시", "양도"]).default("통상실시"),
  fee_type: z.enum(["유상_선납경상", "유상_선납정액", "무상"]).default("유상_선납경상"),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  region: z.string().default("대한민국 전역"),
  impl_content: z.string().default("특허법 제2조 제3호에 규정된 실시행위"),

  /* 계약신청정보 */
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_mobile: z.string().optional(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  contract_amount: z.string().default("0"),
  market_share: z.string().default("0.0"),

  /* 신청업체정보 */
  company_name: z.string().min(1, "회사명을 입력하세요"),
  established_date: z.string().optional(),
  ownership_flag: z.string().optional(),
  business_reg_no: z.string().optional(),
  corp_reg_no: z.string().optional(),
  representative: z.string().optional(),
  biz_type: z.string().optional(),
  industry: z.string().optional(),
  hq_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_fax: z.string().optional(),
  homepage: z.string().optional(),
  products: z.string().optional(),

  /* 기존 필수 필드 (백엔드) */
  technology_name: z.string().optional(),
  patent_no: z.string().optional(),
  transfer_type: z.string().default("통상실시"),
  purpose: z.string().default("기술이전 신청"),
});

type FormData = z.infer<typeof schema>;

/* ───────────── 컴포넌트 헬퍼 ───────────── */
function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[28px] border-b border-gray-200 last:border-0">
      <div className="w-24 shrink-0 bg-gray-50 border-r border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 self-stretch flex items-center">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      <div className="flex-1 px-2 py-1 text-xs">{children}</div>
    </div>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${className}`}
    />
  );
}

function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white ${className}`}
    />
  );
}

function Radio({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-1 mr-3 cursor-pointer text-xs">
      <input type="radio" {...props} className="accent-[var(--primary)]" />
      {label}
    </label>
  );
}

/* ───────────── 메인 페이지 ───────────── */
export default function NewApplicationDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("첨부파일");
  const [attachments, setAttachments] = useState<{ name: string; date: string; uploader: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ownership_type: "국유_농진청",
      ownership_status: "출원",
      case_domestic: true,
      rights_type: "특허",
      contract_type: "신규",
      disposal_type: "통상실시",
      fee_type: "유상_선납경상",
      region: "대한민국 전역",
      impl_content: "특허법 제2조 제3호에 규정된 실시행위",
      contract_amount: "0",
      market_share: "0.0",
      transfer_type: "통상실시",
      purpose: "기술이전 신청",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      applicationApi.create({
        technology_name: data.invention_title || data.technology_name || "",
        patent_no: data.registration_no || data.application_no || data.patent_no,
        transfer_type: data.disposal_type || data.transfer_type,
        purpose: data.impl_content || data.purpose,
        extra_data: data,
      }),
    onSuccess: () => router.push("/applications"),
  });

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        name: f.name,
        date: new Date().toLocaleDateString("ko-KR"),
        uploader: "관리자",
      })),
    ]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const BOTTOM_TABS = ["제품별견적", "사업장", "사업규모", "회사연혁", "대표자정보", "계약관리", "첨부파일"];

  return (
    <div className="flex flex-col h-full bg-gray-100 text-xs">
      {/* ── 타이틀 바 ── */}
      <div className="flex items-center gap-3 bg-white border-b px-4 py-2 shadow-sm">
        <span className="text-sm font-bold text-[var(--primary)]">기술이전 신청/접수관리</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 text-xs">기술이전신청서 신규</span>
        <div className="ml-auto">
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="bg-[var(--primary)] text-white px-4 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* ── 워크플로 스텝 ── */}
      <div className="bg-white border-b px-2 overflow-x-auto">
        <div className="flex">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex flex-col items-center px-3 py-1.5 border-r border-gray-100 min-w-[72px] ${i === 0 ? "bg-[var(--primary-light)]" : ""}`}>
              <span className={`text-[10px] font-bold ${i === 0 ? "text-[var(--primary)]" : "text-gray-500"}`}>{s.org}</span>
              <span className={`text-[10px] mt-0.5 ${i === 0 ? "text-[var(--primary)]" : "text-gray-500"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 메인 폼 영역 ── */}
      <div className="flex-1 overflow-auto p-2">
        <div className="flex gap-2 min-w-[900px]">

          {/* ─── 좌: 관련특허정보 + 실시신청내용 ─── */}
          <div className="flex-[2] space-y-2">

            {/* 관련특허정보 */}
            <div className="bg-white border rounded shadow-sm">
              <div className="bg-gray-100 border-b px-3 py-1 font-bold text-gray-700 text-xs">관련특허정보</div>

              {/* 구분 */}
              <div className="border-b border-gray-200 px-2 py-1.5">
                <div className="text-xs text-gray-600 mb-1 font-medium">구분</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {[
                    { val: "국유_농진청", label: "국유(농진청)" },
                    { val: "국유_검역본부", label: "국유(검역본부)" },
                    { val: "국유_품관원", label: "국유(품관원)" },
                    { val: "국유_종자원", label: "국유(종자원)" },
                    { val: "비국유", label: "비국유" },
                  ].map((o) => (
                    <Radio key={o.val} label={o.label} value={o.val} {...register("ownership_type")} />
                  ))}
                  <span className="mx-2 text-gray-300">|</span>
                  <Radio label="출원" value="출원" {...register("ownership_status")} />
                  <Radio label="등록" value="등록" {...register("ownership_status")} />
                </div>
              </div>

              {/* 사건구분 행 */}
              <div className="flex items-center border-b border-gray-200 text-xs">
                <div className="w-20 shrink-0 bg-gray-50 border-r px-2 py-1.5 font-medium text-gray-700">사건구분</div>
                <div className="flex items-center gap-2 px-2 py-1 flex-wrap">
                  <Select {...register("case_domestic")} className="w-16">
                    <option value="true">국내</option>
                    <option value="false">해외</option>
                  </Select>
                  <Select {...register("rights_type")} className="w-16">
                    <option>특허</option>
                    <option>실용신안</option>
                    <option>품종</option>
                  </Select>
                  <span className="text-gray-500">접수번호</span>
                  <Input {...register("receipt_no")} placeholder="TTMS-2026-0022" className="w-32" />
                  <span className="text-gray-500">출원번호</span>
                  <Input {...register("application_no")} className="w-28" />
                  <span className="text-gray-500">등록번호</span>
                  <Input {...register("registration_no")} className="w-28" />
                  <span className="text-gray-500">발명기관</span>
                  <Input {...register("invention_institution")} className="w-28" />
                </div>
              </div>

              <FieldRow label="발명의 명칭" required>
                <Input {...register("invention_title")} className="w-full" />
                {errors.invention_title && <span className="text-red-500 ml-1">{errors.invention_title.message}</span>}
              </FieldRow>

              <div className="flex items-center border-b border-gray-200">
                <div className="w-20 shrink-0 bg-gray-50 border-r px-2 py-1.5 font-medium text-gray-700 self-stretch flex items-center">발명자</div>
                <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200">
                  <div className="px-2 py-1"><Input {...register("inventor_name")} className="w-full" /></div>
                  <div className="flex items-center px-2 py-1 gap-2">
                    <span className="text-gray-500 shrink-0">전화번호</span>
                    <Input {...register("inventor_phone")} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-20 shrink-0 bg-gray-50 border-r px-2 py-1.5 font-medium text-gray-700 self-stretch flex items-center">출원인</div>
                <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200">
                  <div className="px-2 py-1"><Input {...register("applicant_org")} className="w-full" /></div>
                  <div className="flex items-center px-2 py-1 gap-2">
                    <span className="text-gray-500 shrink-0">등록관리자</span>
                    <Input {...register("registration_manager")} className="flex-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* 실시신청내용 */}
            <div className="bg-white border rounded shadow-sm">
              <div className="bg-gray-100 border-b px-3 py-1 font-bold text-gray-700 text-xs">실시신청내용</div>

              <FieldRow label="계약의 종류">
                <Radio label="신규" value="신규" {...register("contract_type")} />
                <Radio label="재계약" value="재계약" {...register("contract_type")} />
                <Radio label="자동재계약" value="자동재계약" {...register("contract_type")} />
              </FieldRow>

              <FieldRow label="처분의 종류">
                <Radio label="통상실시" value="통상실시" {...register("disposal_type")} />
                <Radio label="전용실시" value="전용실시" {...register("disposal_type")} />
                <Radio label="양도" value="양도" {...register("disposal_type")} />
              </FieldRow>

              <FieldRow label="유무상 여부">
                <Radio label="유상" value="유상_선납경상" {...register("fee_type")} />
                <span className="text-gray-500 mr-2">(</span>
                <Radio label="선납(경상)" value="유상_선납경상" {...register("fee_type")} />
                <Radio label="선납(정액)" value="유상_선납정액" {...register("fee_type")} />
                <span className="text-gray-500 mr-3">)</span>
                <Radio label="무상" value="무상" {...register("fee_type")} />
              </FieldRow>

              <FieldRow label="실시 기간">
                <div className="flex items-center gap-2">
                  <Input {...register("period_start")} type="date" className="w-32" />
                  <span className="text-gray-500">~</span>
                  <Input {...register("period_end")} type="date" className="w-32" />
                </div>
              </FieldRow>

              <FieldRow label="실시 지역">
                <Input {...register("region")} className="w-64" />
              </FieldRow>

              <FieldRow label="실시 내용">
                <Input {...register("impl_content")} className="w-full" />
              </FieldRow>
            </div>
          </div>

          {/* ─── 중: 계약신청정보 ─── */}
          <div className="w-52 space-y-2">
            <div className="bg-white border rounded shadow-sm">
              <div className="bg-gray-100 border-b px-3 py-1 font-bold text-gray-700 text-xs">계약신청정보</div>

              <FieldRow label="신청자">
                <Input {...register("contact_name")} className="w-full" />
              </FieldRow>
              <FieldRow label="이메일">
                <Input {...register("contact_email")} type="email" className="w-full" />
              </FieldRow>
              <FieldRow label="연락처">
                <Input {...register("contact_phone")} className="w-full" />
              </FieldRow>
              <FieldRow label="휴대폰">
                <Input {...register("contact_mobile")} className="w-full" />
              </FieldRow>
              <FieldRow label="우편번호">
                <div className="flex gap-1">
                  <Input {...register("postal_code")} className="w-20" />
                  <button type="button" className="bg-gray-100 border rounded px-1.5 text-[10px] hover:bg-gray-200">우편검색</button>
                </div>
              </FieldRow>
              <FieldRow label="주소">
                <Input {...register("address")} className="w-full" />
              </FieldRow>
              <FieldRow label="권적금액">
                <Input {...register("contract_amount")} className="w-full" />
              </FieldRow>
              <FieldRow label="점유율">
                <Input {...register("market_share")} className="w-full" />
              </FieldRow>
            </div>
          </div>

          {/* ─── 우: 신청업체정보 ─── */}
          <div className="w-56 space-y-2">
            <div className="bg-white border rounded shadow-sm">
              <div className="bg-gray-100 border-b px-3 py-1 font-bold text-gray-700 text-xs">신청업체정보</div>

              <FieldRow label="회사명" required>
                <div className="flex gap-1">
                  <Input {...register("company_name")} className="flex-1" />
                  <button type="button" className="bg-gray-100 border rounded px-1 text-[10px] hover:bg-gray-200">🔍</button>
                </div>
                {errors.company_name && <span className="text-red-500">{errors.company_name.message}</span>}
              </FieldRow>
              <FieldRow label="설립년월일">
                <Input {...register("established_date")} type="date" className="w-full" />
              </FieldRow>
              <FieldRow label="소유여부">
                <Input {...register("ownership_flag")} className="w-full" />
              </FieldRow>
              <FieldRow label="사업자등록번호">
                <Input {...register("business_reg_no")} placeholder="000-00-00000" className="w-full" />
              </FieldRow>
              <FieldRow label="법인등록번호">
                <Input {...register("corp_reg_no")} className="w-full" />
              </FieldRow>
              <FieldRow label="대표자">
                <Input {...register("representative")} className="w-full" />
              </FieldRow>
              <FieldRow label="업태">
                <Input {...register("biz_type")} className="w-full" />
              </FieldRow>
              <FieldRow label="업종">
                <Input {...register("industry")} className="w-full" />
              </FieldRow>
              <FieldRow label="본사 주소">
                <Input {...register("hq_address")} className="w-full" />
              </FieldRow>
              <FieldRow label="전화번호">
                <Input {...register("company_phone")} className="w-full" />
              </FieldRow>
              <FieldRow label="FAX">
                <Input {...register("company_fax")} className="w-full" />
              </FieldRow>
              <FieldRow label="홈페이지">
                <Input {...register("homepage")} placeholder="https://" className="w-full" />
              </FieldRow>
              <FieldRow label="생산품목">
                <Input {...register("products")} className="w-full" />
              </FieldRow>
            </div>
          </div>
        </div>

        {/* ── 하단 탭 영역 ── */}
        <div className="mt-2 bg-white border rounded shadow-sm min-w-[900px]">
          {/* 탭 헤더 */}
          <div className="flex border-b">
            {BOTTOM_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs border-r transition-colors ${
                  activeTab === tab
                    ? "bg-[var(--primary)] text-white font-medium"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-blue-50 border border-blue-300 rounded px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
              >
                + 추가
              </button>
              <button type="button" className="bg-gray-50 border rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100">
                🔄 수정
              </button>
              <button type="button" className="bg-gray-50 border rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100">
                ✕ 삭제
              </button>
            </div>
            <input ref={fileRef} type="file" multiple hidden onChange={handleFileAdd} />
          </div>

          {/* 탭 콘텐츠 */}
          <div className="min-h-[120px]">
            {activeTab === "첨부파일" && (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-8 px-2 py-1.5 text-center border-r">V</th>
                    <th className="px-3 py-1.5 text-left border-r">파일명</th>
                    <th className="w-24 px-2 py-1.5 text-center border-r">등록일자</th>
                    <th className="w-20 px-2 py-1.5 text-center border-r">성명</th>
                    <th className="w-16 px-2 py-1.5 text-center">등록</th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">
                        첨부파일이 없습니다. [+ 추가]를 클릭하여 파일을 첨부하세요.
                      </td>
                    </tr>
                  )}
                  {attachments.map((a, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-1 text-center border-r">
                        <input type="checkbox" className="accent-[var(--primary)]" />
                      </td>
                      <td className="px-3 py-1 border-r text-blue-600">{a.name}</td>
                      <td className="px-2 py-1 text-center border-r text-gray-500">{a.date}</td>
                      <td className="px-2 py-1 text-center border-r text-gray-500">{a.uploader}</td>
                      <td className="px-2 py-1 text-center">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-500 hover:underline text-[10px]"
                          >삭제</button>
                          <button type="button" className="text-blue-500 hover:underline text-[10px]">열기</button>
                          <button type="button" className="text-green-600 hover:underline text-[10px]">다운</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "제품별견적" && (
              <div className="p-4 text-gray-400 text-center py-8">제품별 견적 정보를 입력하세요.</div>
            )}
            {activeTab === "사업장" && (
              <div className="p-4 text-gray-400 text-center py-8">사업장 정보를 입력하세요.</div>
            )}
            {activeTab === "사업규모" && (
              <div className="p-4 text-gray-400 text-center py-8">사업 규모 정보를 입력하세요.</div>
            )}
            {activeTab === "회사연혁" && (
              <div className="p-4 text-gray-400 text-center py-8">회사 연혁을 입력하세요.</div>
            )}
            {activeTab === "대표자정보" && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">대표자명</label>
                    <Input {...register("representative")} className="w-full" />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "계약관리" && (
              <div className="p-4 text-gray-400 text-center py-8">계약 관리 정보를 입력하세요.</div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-3 flex justify-end gap-2 min-w-[900px]">
          {mutation.isError && (
            <span className="text-red-500 text-xs mr-auto self-center">
              저장 중 오류가 발생했습니다. 다시 시도해주세요.
            </span>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-5 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="bg-[var(--primary)] text-white px-6 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
