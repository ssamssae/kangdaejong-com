// Project chapters, independent of each app's release version.
export const projectVersions = [
  { version: '1.0', label: '이전 프로젝트', href: '/archive/' },
  { version: '2.0', label: '지금 만드는 것', href: '/' },
  { version: '3.0', label: '다음 이야기', href: null },
];

export const currentProjects = [
  { name: '입타', mark: '입', category: '말을 글로', status: 'Mac · Windows', description: '쓰던 입력칸에서 말하면 글이 됩니다. 한국어 받아쓰기는 내 컴퓨터에서 처리합니다.', href: '/ipta/', action: '설치·사용 방법 보기' },
  { name: '콜타', mark: '콜', category: '목소리로 대화', status: '무료 음성 대화', description: 'AI와 목소리로 이야기를 나눕니다. 한 번에 한 분, 최대 3분 동안 이용할 수 있습니다.', href: 'https://callta.kangdaejong.com/', action: '콜타와 이야기하기' },
  { name: '로고꾸러미', mark: '로', category: '브랜드의 첫 모습', status: '무료 견본 편집', description: '로고 견본을 편집하고 활용 파일을 내려받습니다. 유료 AI 생성은 준비 중입니다.', href: 'https://logo.kangdaejong.com/', action: '로고꾸러미 둘러보기' },
  { name: '사진꾸러미', mark: '사', category: '사진의 밝기와 색감', status: '기본 보정 무료', description: '인물·상품·음식 사진의 밝기와 색감을 다듬습니다. 사진 전송이나 가입 없이 사용할 수 있습니다.', href: '/photo/', action: '사진꾸러미 무료로 사용하기' },
];

// Featured work spans chapters; historical membership remains unchanged.
export const featuredProjects = [
  { name: '텔레그램 브릿지', mark: '↔', category: '휴대폰과 내 컴퓨터를 연결', status: '공개 소스', description: '휴대폰에서 내 컴퓨터의 AI에게 요청하고 답을 받습니다. Codex·Cursor·Claude·Grok을 연결하는 도구입니다.', href: '/archive/#open-tools', action: '브릿지 시연·설치 안내 보기' },
  currentProjects[0],
  { name: '자비스', mark: '자', category: '목소리로 부르는 AI 비서', status: '실험 프로젝트 · 소스 공개', description: 'Mac에서 목소리로 부르고, AI의 답을 스피커로 듣는 음성 비서를 만들고 있습니다. 소스를 받아 직접 설정해 사용하는 프로젝트입니다.', href: 'https://github.com/ssamssae/jarvis-mac', action: '자비스 소개·소스 보기' },
];
