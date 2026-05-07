import { NextRequest, NextResponse } from "next/server";

const FSC_API_KEY = process.env.FSC_API_KEY || "56e0be3845e195ff1e1856d46a6199a4c48e3fb5459bd8380c510534d8cc9041";
const FSC_BASE = "https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2";
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const corpNm = sp.get("corpNm") || "";
  const crno = sp.get("crno") || "";
  const pageNo = sp.get("pageNo") || "1";
  const numOfRows = sp.get("numOfRows") || "10";

  const params = new URLSearchParams({
    serviceKey: FSC_API_KEY,
    pageNo,
    numOfRows,
    resultType: "json",
    basDt: TODAY,
  });
  if (corpNm) params.set("corpNm", corpNm);
  if (crno) params.set("crno", crno);

  const res = await fetch(`${FSC_BASE}?${params.toString()}`);
  if (!res.ok) return NextResponse.json({ error: `FSC API ${res.status}` }, { status: res.status });

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return NextResponse.json([]);
  return NextResponse.json(Array.isArray(items) ? items : [items]);
}
