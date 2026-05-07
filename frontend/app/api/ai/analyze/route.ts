import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const { company, targetTech } = await req.json();

  const prompt = `당신은 기술이전 전문가입니다. 기업 정보를 분석하여 기술이전 라이선싱 적합성을 평가해주세요.

기업명: ${company.name} / 업종: ${company.industry} / 지역: ${company.region}
규모: ${company.size} (임직원 ${company.employees}명) / 매출: ${company.revenue}
${company.growth != null ? `성장률: ${company.growth}%` : ""} ${company.patent != null ? `/ 특허: ${company.patent}건` : ""}
${company.ceo ? `대표자: ${company.ceo}` : ""}
기업소개: ${company.desc}
이전 대상 기술: ${targetTech || "농업 AI·IoT 기술"}

기술이전 관점에서 아래 JSON만 응답(백틱 없이):
{"score":숫자(0-100),"grade":"S/A/B/C","summary":"기술이전 적합성 2줄 요약","strengths":["강점1","강점2","강점3"],"approach":"기술이전 제안 접근전략 2-3문장","timing":"최적 컨택타이밍","keywords":["키워드1","키워드2","키워드3"],"transferFit":{"absorption":"기술흡수역량 평가 1문장","demand":"기술수요 적합성 1문장","commercialization":"상용화 가능성 1문장"}}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json(null);
  }
}
