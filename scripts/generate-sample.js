const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const headers = [
  "연 번", "성 명", "방문결과", "채무액", "주 소", "연락처", "최근방문일", "누적방문횟", "다음예정일", "다음예정시", "비고"
];

const data = [
  headers,
  [1, "홍길동", "부재중", "1,500,000", "서울특별시 강남구 테헤란로 123, 101호", "010-1234-5678", "2024.01.15", 2, "2024.02.01", "14:00", "방문 전 연락 요망"],
  [2, "김철수", "안내문 부착", "3,200,000", "경기도 성남시 분당구 판교역로 456, 202호", "010-9876-5432", "2024.01.10", 3, "2024.02.05", "10:30", "부재 시 안내문 부착"],
  [3, "이영희", "거부", "850,000", "부산광역시 해운대구 센텀중앙로 789, 303호", "010-1111-2222", "2024.01.05", 1, "2024.02.10", "16:00", "최근 주소지 변경 이력 있음"]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Adjust column widths for better readability
ws["!cols"] = [
  { wch: 8 },  // 연번
  { wch: 10 }, // 성명
  { wch: 12 }, // 방문결과
  { wch: 15 }, // 채무액
  { wch: 40 }, // 주소
  { wch: 15 }, // 연락처
  { wch: 15 }, // 최근방문일
  { wch: 10 }, // 누적방문횟
  { wch: 15 }, // 다음예정일
  { wch: 10 }, // 다음예정시
  { wch: 30 }  // 비고
];

XLSX.utils.book_append_sheet(wb, ws, "방문대상자");

const targetDir = path.join(__dirname, "../public/templates");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

XLSX.writeFile(wb, path.join(targetDir, "visit-list-template.xlsx"));
console.log("visit-list-template.xlsx generated successfully.");
