const pptxgen = require("pptxgenjs");
const QRCode = require("qrcode");
const path = require("node:path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "강대종 · 마이너스베타스튜디오";
pptx.subject = "AI 창업 스터디 자기소개";
pptx.title = "강대종 자기소개 · 마이너스베타스튜디오";
pptx.company = "마이너스베타스튜디오";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Apple SD Gothic Neo",
  bodyFontFace: "Apple SD Gothic Neo",
  lang: "ko-KR",
};

const slide = pptx.addSlide();
const C = {
  bg: "0A0C0F",
  panel: "13171C",
  panel2: "181D23",
  line: "2A3139",
  text: "F5F7F8",
  muted: "A9B1BA",
  accent: "4FE0C0",
  accentDark: "153E36",
  black: "000000",
};
const F = "Apple SD Gothic Neo";
const outDir = __dirname;
const deckPath = path.join(outDir, "kangdaejong-ai-startup-study-self-intro.pptx");

function addText(text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: F,
    color: C.text,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    valign: "mid",
    ...options,
  });
}

function addMetric(x, value, label) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 3.68, w: 1.48, h: 1.02,
    rectRadius: 0.09,
    fill: { color: C.panel2 },
    line: { color: C.line, width: 0.7 },
  });
  addText(value, x + 0.16, 3.80, 1.16, 0.42, {
    fontFace: "Helvetica Neue",
    fontSize: 25,
    bold: true,
    color: C.accent,
  });
  addText(label, x + 0.16, 4.23, 1.16, 0.24, {
    fontSize: 10.5,
    color: C.muted,
  });
}

function addStep(y, index, title, body) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 8.58, y, w: 0.38, h: 0.38,
    fill: { color: C.accent },
    line: { color: C.accent },
  });
  addText(String(index).padStart(2, "0"), 8.58, y + 0.01, 0.38, 0.34, {
    fontFace: "Helvetica Neue",
    fontSize: 8.5,
    bold: true,
    color: C.black,
    align: "center",
  });
  addText(title, 9.17, y - 0.01, 2.90, 0.28, {
    fontSize: 14,
    bold: true,
  });
  addText(body, 9.17, y + 0.30, 2.90, 0.45, {
    fontSize: 10.5,
    color: C.muted,
    breakLine: true,
    valign: "top",
    fit: "shrink",
  });
}

slide.background = { color: C.bg };

// Header
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.68, y: 0.52, w: 0.43, h: 0.43,
  rectRadius: 0.08,
  fill: { color: C.accentDark },
  line: { color: C.accentDark },
});
addText("mβ", 0.68, 0.535, 0.43, 0.37, {
  fontFace: "Helvetica Neue",
  fontSize: 15,
  bold: true,
  color: C.accent,
  align: "center",
});
addText("MINUS BETA STUDIO", 1.25, 0.55, 2.30, 0.25, {
  fontFace: "Helvetica Neue",
  fontSize: 10,
  bold: true,
  charSpacing: 1.4,
});
addText("AI STARTUP STUDY · 2026.09.04", 9.58, 0.55, 3.05, 0.25, {
  fontFace: "Helvetica Neue",
  fontSize: 8.5,
  color: C.muted,
  charSpacing: 1.1,
  align: "right",
});
slide.addShape(pptx.ShapeType.line, {
  x: 0.68, y: 1.10, w: 11.96, h: 0,
  line: { color: C.line, width: 0.7 },
});

// Main identity
addText("강대종", 0.68, 1.42, 3.10, 0.58, {
  fontSize: 31,
  bold: true,
});
slide.addShape(pptx.ShapeType.roundRect, {
  x: 3.72, y: 1.54, w: 1.78, h: 0.33,
  rectRadius: 0.08,
  fill: { color: C.accentDark },
  line: { color: C.accentDark },
});
addText("1인 빌더 · 서울 마포", 3.82, 1.575, 1.58, 0.24, {
  fontSize: 9.5,
  bold: true,
  color: C.accent,
  align: "center",
});
addText("작게 만들고,\n오래 운영합니다.", 0.68, 2.05, 6.65, 1.16, {
  fontSize: 30,
  bold: true,
  breakLine: true,
  breakLineOnOverflow: false,
  valign: "top",
  paraSpaceAfterPt: 0,
  lineSpacingMultiple: 0.90,
});
addText("마이너스베타스튜디오 대표 · 생활 앱과 AI 서비스를 직접 만들고 검증하며 운영합니다.", 0.70, 3.17, 6.65, 0.34, {
  fontSize: 12.5,
  color: C.muted,
});

// Metrics
addMetric(0.68, "16", "공개 제품");
addMetric(2.30, "7", "출시 앱");
addMetric(3.92, "3", "오픈소스 도구");
addMetric(5.54, "111", "뉴스레터");

// Product focus bands
addText("WHAT I BUILD", 0.70, 5.06, 1.70, 0.22, {
  fontFace: "Helvetica Neue",
  fontSize: 8.5,
  bold: true,
  charSpacing: 1.5,
  color: C.accent,
});
addText("생활 앱", 0.70, 5.39, 1.15, 0.28, { fontSize: 13, bold: true });
addText("한줄일기 · 메모요 · 약먹자", 0.70, 5.72, 2.45, 0.25, { fontSize: 10, color: C.muted });
addText("AI 웹", 3.28, 5.39, 1.15, 0.28, { fontSize: 13, bold: true });
addText("첫이름 — AI 사주 작명", 3.28, 5.72, 2.25, 0.25, { fontSize: 10, color: C.muted });
addText("AI 자동화", 5.68, 5.39, 1.30, 0.28, { fontSize: 13, bold: true });
addText("Codex · Claude · Grok Bridge", 5.68, 5.72, 2.35, 0.25, { fontSize: 10, color: C.muted });

// Right panel
slide.addShape(pptx.ShapeType.roundRect, {
  x: 8.22, y: 1.38, w: 4.41, h: 4.72,
  rectRadius: 0.12,
  fill: { color: C.panel },
  line: { color: C.line, width: 0.8 },
});
addText("AI를 쓰는 방식", 8.58, 1.72, 3.42, 0.35, {
  fontSize: 18,
  bold: true,
});
addText("기능 하나가 아니라, 작은 팀의 운영 방식으로.", 8.58, 2.10, 3.42, 0.28, {
  fontSize: 10.5,
  color: C.muted,
});
slide.addShape(pptx.ShapeType.line, {
  x: 8.77, y: 2.75, w: 0, h: 2.03,
  line: { color: C.line, width: 1.2 },
});
addStep(2.61, 1, "BUILD", "아이디어를 작게 제품으로 만듭니다.");
addStep(3.53, 2, "OPERATE", "에이전트와 자동화로 반복을 줄입니다.");
addStep(4.45, 3, "SHARE", "과정과 실패를 기록으로 남깁니다.");

// Closing card + URL
slide.addShape(pptx.ShapeType.roundRect, {
  x: 8.22, y: 6.28, w: 4.41, h: 0.68,
  rectRadius: 0.08,
  fill: { color: C.accent },
  line: { color: C.accent },
});
addText("오늘 나누고 싶은 것", 8.50, 6.39, 1.57, 0.18, {
  fontSize: 8.5,
  bold: true,
  color: C.black,
});
addText("1인이 AI를 팀처럼 쓰는 법", 8.50, 6.58, 3.60, 0.24, {
  fontSize: 13,
  bold: true,
  color: C.black,
});

async function writeDeck() {
  const qr = await QRCode.toDataURL("https://kangdaejong.com", {
    width: 360,
    margin: 1,
    color: { dark: "#0A0C0F", light: "#FFFFFF" },
  });
  slide.addImage({ data: qr, x: 0.68, y: 6.28, w: 0.68, h: 0.68 });
  addText("kangdaejong.com", 1.55, 6.39, 2.30, 0.24, {
    fontFace: "Helvetica Neue",
    fontSize: 12,
    bold: true,
  });
  addText("제품 · 작업일지 · 뉴스레터", 1.55, 6.64, 2.55, 0.19, {
    fontSize: 8.5,
    color: C.muted,
  });
  addText("Tools Worth Keeping.", 5.48, 6.49, 2.35, 0.22, {
    fontFace: "Helvetica Neue",
    fontSize: 9,
    bold: true,
    color: C.muted,
    charSpacing: 0.7,
    align: "right",
  });

  slide.addNotes([
    "공개 자료 출처: https://kangdaejong.com / https://work.kangdaejong.com",
    "2026-09-04 기준 공개 수치: 제품 16, 출시 앱 7, 오픈소스 도구 3, 뉴스레터 111편.",
  ]);

  await pptx.writeFile({ fileName: deckPath });
}

writeDeck().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
