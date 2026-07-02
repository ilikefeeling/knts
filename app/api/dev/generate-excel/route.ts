import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const headers = [
      "고유관리번호(필수)", "체납자구분(개인/법인)", "체납자명(필수)", "주민/법인번호",
      "연락처", "관할구역", "주민등록상 주소", "실거주지 주소(필수)",
      "부과기관", "체납세목", "총체납액", "최초납기일",
      "체납건수", "재산압류내역", "독촉장발송여부", "분납진행여부", "비고(메모)"
    ];

    const dataRows = [];
    for (let i = 1; i <= 100; i++) {
      const idStr = String(i).padStart(4, "0");
      dataRows.push([
        `TEST-2026-${idStr}`,
        i % 5 === 0 ? "법인" : "개인",
        `테스트체납자${i}`,
        `800101-1${String(i).padStart(6, "0")}`,
        `010-1234-${String(i).padStart(4, "0")}`,
        "테스트구 테스트동",
        `테스트시 테스트구 테스트동 ${i}번지`,
        `테스트시 테스트구 테스트동 ${i}번지 ${i}호`,
        "테스트구청 세무과",
        i % 2 === 0 ? "주정차위반과태료" : "지방소득세",
        String(100000 * (i % 10 + 1)),
        "2025-01-01",
        String(i % 5 + 1),
        i % 3 === 0 ? "예금압류" : "",
        i % 2 === 0 ? "발송" : "미발송",
        "해당없음",
        "테스트 샘플 데이터입니다."
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "체납자원장_100건_샘플");

    const filePath = path.join(process.cwd(), "public", "sample-100-rows.xlsx");
    XLSX.writeFile(wb, filePath);

    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
