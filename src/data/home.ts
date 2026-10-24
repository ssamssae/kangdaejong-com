import { productIcon } from '../lib/product-icons.mjs';
export const books = [
  {
    number: "01",
    name: "1인회사 AI자동화",
    price: "전자책 · 무료 공개",
    file: "/books/solo-company-ai-automation.pdf",
    pages: 69,
    description: "1인 비즈니스의 구조화부터 콘텐츠, 자동화, 판매까지 실제 작업 흐름을 정리했어요.",
  },
  {
    number: "02",
    name: "혼자서 AI팀",
    price: "전자책 · 무료 공개",
    file: "/books/solo-ai-team.pdf",
    pages: 72,
    description: "혼자 일하면서 여러 AI 역할을 팀처럼 구성하고 운영하는 방법을 정리했어요.",
  },
  {
    number: "03",
    name: "폰으로 내 컴퓨터 AI 부리기",
    price: "전자책 · 무료 공개",
    file: "/books/phone-controls-my-computer-ai.pdf",
    pages: 39,
    description: "텔레그램에 내 컴퓨터의 AI 도구를 연결하는 과정을 비개발자 눈높이로 정리한 안내서예요.",
  },
];

// icon/icon2x: 그록봇이 2026-10-11 만든 4칸 카드(tgbridges_card.jpg)를 브릿지별로 자른 타일, 48/96px WebP (T-261011-068).
export const tools = [
  {
    name: "Grok Telegram Bridge",
    ...productIcon('bridge-grok'),
    description: "텔레그램으로 자기 컴퓨터의 Grok 세션을 사용하는 공개 브릿지.",
    repo: "https://github.com/ssamssae/grok-telegram-bridge",
    release: "https://github.com/ssamssae/grok-telegram-bridge/releases",
  },
  {
    name: "Codex Telegram Bridge",
    ...productIcon('bridge-codex'),
    description: "Codex CLI 세션에 텍스트와 미디어를 전달하고 진행 상황을 받는 공개 브릿지.",
    repo: "https://github.com/ssamssae/codex-telegram-bridge",
    release: "https://github.com/ssamssae/codex-telegram-bridge/releases",
  },
  {
    name: "Claude Telegram Bridge",
    ...productIcon('bridge-claude'),
    description: "Claude Code 세션을 텔레그램에 연결하는 공개 브릿지.",
    repo: "https://github.com/ssamssae/claude-telegram-bridge",
    release: "https://github.com/ssamssae/claude-telegram-bridge/releases",
  },
  {
    name: "Cursor Telegram Bridge",
    ...productIcon('bridge-cursor'),
    description: "텔레그램으로 자기 컴퓨터의 Cursor 세션에 질문하고 답변을 받는 공개 브릿지.",
    repo: "https://github.com/ssamssae/cursor-telegram-bridge",
    release: "https://github.com/ssamssae/cursor-telegram-bridge/releases",
  },
  // T-261024-056: 웹 설명서(/product/…) 가 없어 설치 안내는 GitHub 설명서로 보낸다.
  {
    name: "Grok Bot Telegram Bridge",
    ...productIcon('bridge-grokbot'),
    description: "텔레그램으로 그록봇 앱의 봇 하나와 대화하는 공개 브릿지.",
    repo: "https://github.com/ssamssae/grokbot-telegram-bridge",
    release: "https://github.com/ssamssae/grokbot-telegram-bridge/releases",
    guide: "https://github.com/ssamssae/grokbot-telegram-bridge/blob/main/README.ko.md",
  },
];


export const apps = [
  {
    "name": "한줄일기",
    ...productIcon('hanjul'),
    "description": "하루를 한 줄로 남기는 일기.",
    "appId": "6764308678",
    "package": "com.daejongkang.hanjul"
  },
  {
    "name": "메모요",
    ...productIcon('memoyo'),
    "description": "생각날 때 바로 적는 메모장.",
    "appId": "6762068073",
    "package": "com.daejongkang.simple_memo_app"
  },
  {
    "name": "더치페이 계산기",
    ...productIcon('dutchpay'),
    "description": "모임의 비용을 간편하게 나눠요.",
    "appId": "6762072499",
    "package": "com.daejongkang.dutchpay"
  },
  {
    "name": "약먹자",
    ...productIcon('yakmeokja'),
    "description": "약 먹을 시간을 알려드려요.",
    "appId": "6762100639",
    "package": "com.daejongkang.yakmukja"
  },
  {
    "name": "심플 가계부",
    ...productIcon('gagyebu'),
    "description": "수입과 지출을 가볍게 기록해요.",
    "appId": "6769037337",
    "package": "com.ssamssae.mini_expense",
    "support": "/support-gagyebu/"
  },
  {
    "name": "계산기알람",
    ...productIcon('calcalarm'),
    "description": "계산 문제를 풀며 잠에서 깨요.",
    "appId": "6811111727",
    "package": "com.daejongkang.ireonayo",
    "support": "/support-calcalarm/"
  },
  {
    "name": "살아있음",
    ...productIcon('stillhere'),
    "description": "두 사람이 하루 한 번 서로의 안부를 나눠요.",
    "appId": "6812609143",
    "package": "com.daejongkang.stillhere",
    "support": "/support-stillhere/"
  },
  {
    "name": "우리 사이",
    ...productIcon('oursai'),
    "description": "사진과 일기, 기념일로 둘만의 일상을 남겨요.",
    "appId": "6816725770",
    "support": "/our-sai/",
    "storeNote": "iPhone · Android 준비 중"
  },
  {
    "name": "노래찾기",
    ...productIcon('noraechatgi'),
    "description": "버튼 한 번으로 주변 음악의 제목과 가수를 찾아요.",
    "appId": "6820080312",
    "support": "/support-noraechatgi/",
    "storeNote": "iPhone"
  }
];
