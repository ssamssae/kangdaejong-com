// 강대종 · 마이너스베타스튜디오 — 마포구 AI 창업 스터디 1회 자기소개 (1페이지)
// 사실 출처 = kangdaejong.com (2026-09-04 실측): 출시 앱 7 · 웹 서비스 1 · 공개 도구 3 · 전자책 3.
// 톤 = 회사홈 남색(#10161f) + 코퍼(#d4a574). 프로젝터용 밝은 배경, 글자는 방 뒤에서도 읽히게.
// 글꼴 = Noto Sans KR (Google Slides 내장 → 업로드 후에도 모양 유지).
const pptxgen = require("pptxgenjs");
const QRCode = require("qrcode");
const path = require("node:path");

const OUT = process.env.OUT_PPTX || path.join(__dirname, "kangdaejong-ai-startup-study-self-intro.pptx");

const C = {
  paper: "F6F2EA",
  navy: "10161F",
  navy2: "1B2330",
  ink: "1F2733",
  muted: "6B7280",
  copper: "D4A574",
  copperDeep: "B8824A",
  line: "DDD3C4",
  white: "FFFFFF",
};
const F = "Noto Sans KR";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pptx.author = "강대종 · 마이너스베타스튜디오";
pptx.title = "강대종 자기소개 — 마포구 AI 창업 스터디 1회";
pptx.company = "마이너스베타스튜디오";
pptx.lang = "ko-KR";
pptx.theme = { headFontFace: F, bodyFontFace: F, lang: "ko-KR" };

const s = pptx.addSlide();
s.background = { color: C.paper };

const T = (text, x, y, w, h, o = {}) =>
  s.addText(text, { x, y, w, h, fontFace: F, color: C.ink, margin: 0, valign: "top", ...o });

// ── 상단 라벨 ─────────────────────────────────────────────────────────────
s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 0.55, w: 0.16, h: 0.16, fill: { color: C.copper }, line: { color: C.copper } });
T("마이너스베타스튜디오 · 1인 스튜디오 · 마포구 공덕동", 0.98, 0.5, 6.5, 0.28, { fontSize: 12, color: C.muted, valign: "mid" });
T("마포구 AI 창업 스터디 1회 · 2026.09.04", 7.6, 0.5, 5.05, 0.28, { fontSize: 12, color: C.muted, align: "right", valign: "mid" });

// ── 이름 · 정체 ────────────────────────────────────────────────────────────
T("강대종", 0.7, 1.0, 4.2, 1.05, { fontSize: 60, bold: true, color: C.navy, valign: "mid", charSpacing: -2 });
T("앱 7개를 혼자 만들고 운영하는 1인 스튜디오 대표", 0.7, 2.05, 7.2, 0.45, { fontSize: 20, color: C.ink, valign: "mid" });
T("작게 만들고, 오래 운영합니다.", 0.7, 2.5, 7.2, 0.45, { fontSize: 20, bold: true, color: C.copperDeep, valign: "mid" });

// ── 만든 것 (3열) ──────────────────────────────────────────────────────────
s.addShape(pptx.ShapeType.line, { x: 0.7, y: 3.25, w: 7.2, h: 0, line: { color: C.line, width: 1 } });
T("만든 것", 0.7, 3.38, 3, 0.26, { fontSize: 11, bold: true, color: C.muted, charSpacing: 2 });

function col(x, num, label, body) {
  T(num, x, 3.68, 2.3, 0.75, { fontSize: 44, bold: true, color: C.navy, valign: "mid", charSpacing: -1 });
  T(label, x, 4.42, 2.3, 0.3, { fontSize: 14, bold: true, color: C.ink, valign: "mid" });
  T(body, x, 4.74, 2.3, 0.95, { fontSize: 11.5, color: C.muted, valign: "top", lineSpacingMultiple: 1.25 });
}
col(0.7, "7", "출시 앱", "한줄일기 · 메모요 · 약먹자\n더치페이 계산기 · 단어요\n한컵 · 포모도로");
col(3.15, "1", "웹 서비스", "첫이름 — 사주·획수를 따져\n아이 이름 후보를 뽑는\nAI 작명 서비스");
col(5.6, "3", "오픈소스", "Claude · Codex · Grok\nTelegram Bridge —\n폰으로 내 컴퓨터 AI 부리기");

// ── 하단: QR + 링크 ─────────────────────────────────────────────────────────
s.addShape(pptx.ShapeType.line, { x: 0.7, y: 5.9, w: 7.2, h: 0, line: { color: C.line, width: 1 } });

// ── 오른쪽 카드: AI를 쓰는 방식 ─────────────────────────────────────────────
const cx = 8.45, cy = 1.0, cw = 4.2, ch = 4.9;
s.addShape(pptx.ShapeType.roundRect, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.12, fill: { color: C.navy }, line: { color: C.navy } });
T("혼자지만, 팀처럼 일합니다", cx + 0.38, cy + 0.35, cw - 0.76, 0.4, { fontSize: 18, bold: true, color: C.white, valign: "mid" });
T("AI 에이전트 3 — 대표 1 · 워커 2. 감독은 사람.", cx + 0.38, cy + 0.78, cw - 0.76, 0.3, { fontSize: 12, color: C.copper, valign: "mid" });

function row(i, y, head, body) {
  s.addShape(pptx.ShapeType.ellipse, { x: cx + 0.38, y, w: 0.34, h: 0.34, fill: { color: C.copper }, line: { color: C.copper } });
  T(String(i), cx + 0.38, y, 0.34, 0.34, { fontSize: 11, bold: true, color: C.navy, align: "center", valign: "mid" });
  T(head, cx + 0.86, y - 0.03, cw - 1.24, 0.3, { fontSize: 14, bold: true, color: C.white, valign: "mid" });
  T(body, cx + 0.86, y + 0.28, cw - 1.24, 0.55, { fontSize: 11.5, color: "C9CFD8", valign: "top", lineSpacingMultiple: 1.2 });
}
row(1, cy + 1.35, "만들기", "아이디어는 작은 앱으로 먼저 내보내고\n스토어 반응으로 검증합니다.");
row(2, cy + 2.5, "운영", "고객응대·배포·보고 같은 반복은\n에이전트와 브릿지가 처리합니다.");
row(3, cy + 3.65, "기록", "작업일지·뉴스레터·전자책 3권으로\n과정과 실패를 공개합니다.");

// 카드 아래 강조 띠: 오늘 나누고 싶은 것
s.addShape(pptx.ShapeType.roundRect, { x: cx, y: 6.05, w: cw, h: 0.85, rectRadius: 0.1, fill: { color: C.copper }, line: { color: C.copper } });
T("오늘 나누고 싶은 것", cx + 0.38, 6.13, cw - 0.76, 0.26, { fontSize: 10.5, color: C.navy, valign: "mid" });
T("1인이 AI로 여러 제품을 동시에 굴리는 법", cx + 0.3, 6.38, cw - 0.55, 0.42, { fontSize: 15, bold: true, color: C.navy, valign: "mid" });

module.exports = (async () => {
  const qr = await QRCode.toDataURL("https://kangdaejong.com", { width: 480, margin: 1, color: { dark: "#10161F", light: "#F6F2EA" } });
  s.addImage({ data: qr, x: 0.7, y: 6.05, w: 0.85, h: 0.85 });
  T("kangdaejong.com", 1.7, 6.1, 3.2, 0.36, { fontSize: 16, bold: true, color: C.navy, valign: "mid" });
  T("제품 · 작업일지 · 뉴스레터 — work.kangdaejong.com", 1.7, 6.46, 4.6, 0.3, { fontSize: 11.5, color: C.muted, valign: "mid" });
  T("Tools Worth Keeping.", 5.2, 6.35, 2.7, 0.3, { fontSize: 12, italic: true, color: C.copperDeep, align: "right", valign: "mid" });
  await pptx.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
