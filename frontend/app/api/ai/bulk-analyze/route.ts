import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const { companies, targetTech } = await req.json();

  const list = (companies as { name: string; industry: string; size: string; employees: number }[])
    .map((c) => `- ${c.name} (${c.industry}, ${c.size}, 임직원 ${c.employees}명)`)
    .join("\n");

  const prompt = `기술이전 전문가로서 다음 기업들의 기술이전 수요 가능성을 평가하세요.
이전 대상 기술: ${targetTech || "농업 AI·IoT 기술"}
기업 목록:\n${list}
JSON 배열만 응답(백틱 없이): [{"name":"기업명","score":숫자,"reason":"기술이전 적합성 한줄이유"}]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = (data.content?.[0]?.text || "[]").replace(/```json|```/g, "").trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json([]);
  }
}
