/*
 * 마이너스베타스튜디오 공통 헤더/푸터 (single source of truth)
 * 세 사이트(kangdaejong.com / founder / work)가 이 파일 하나를 불러 씁니다.
 * 메뉴·색·회사정보를 여기서만 고치면 세 사이트에 동시 반영됩니다.
 *
 * 사용법:
 *   <script src="https://kangdaejong.com/mb-components.js" defer></script>
 *   <mb-header active="home"></mb-header>   // active = home|founder|workshop|worklog|newsletter|insights|products|system|lab
 *   <mb-footer></mb-footer>
 */
(function () {
  const BADGE = 'https://kangdaejong.com/minusbeta-badge.svg';

  // work.kangdaejong.com(작업장)의 Nav 헤더와 동일 구조로 통일 (2026-07-06):
  //   1행 = 브랜드 + 주 메뉴(작업장/제품/작업일지/뉴스레터/인사이트/시스템) + 문의 CTA
  //   2행 = 보조 메뉴(회사소개/대표소개/lab)
  const BRAND_HREF = 'https://work.kangdaejong.com/';
  const NAV_PRIMARY = [
    { key: 'workshop',   label: '작업장',   href: 'https://work.kangdaejong.com/' },
    { key: 'products',   label: '제품',     href: 'https://work.kangdaejong.com/products/' },
    { key: 'worklog',    label: '작업일지', href: 'https://work.kangdaejong.com/worklog' },
    { key: 'newsletter', label: '뉴스레터', href: 'https://work.kangdaejong.com/newsletter' },
    { key: 'insights',   label: '인사이트', href: 'https://work.kangdaejong.com/insights' },
    { key: 'system',     label: '시스템',   href: 'https://work.kangdaejong.com/system' },
  ];
  const NAV_SECONDARY = [
    { key: 'home',    label: '회사소개', href: 'https://kangdaejong.com/' },
    { key: 'founder', label: '대표소개', href: 'https://founder.kangdaejong.com/' },
    { key: 'lab',     label: 'lab',      href: 'https://work.kangdaejong.com/lab' },
  ];

  // 공통 팔레트 (shadow DOM 안에서 자족 — 각 사이트 CSS 변수와 무관하게 동일하게 렌더)
  const PALETTE = `
    --mb-bg:#ffffff; --mb-elev:#f7f7f7; --mb-fg:#111111; --mb-dim:#4f4f4f; --mb-mute:#777777;
    --mb-border:#dedede; --mb-soft:#eeeeee; --mb-accent:#2563eb; --mb-accent-dim:#1748b8;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;
  `;

  class MbHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const mk = (n) =>
        `<a href="${n.href}"${n.key === active ? ' class="active" aria-current="page"' : ''}>${n.label}</a>`;
      const primary = NAV_PRIMARY.map(mk).join('');
      const secondary = NAV_SECONDARY.map(mk).join('');
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${PALETTE} display:block; }
          .hdr { position:sticky; top:0; z-index:50; border-bottom:1px solid var(--mb-border); background:color-mix(in srgb, var(--mb-bg) 94%, transparent); backdrop-filter:blur(12px); font-family:var(--mb-sans); }
          .inner { width:min(calc(100% - 48px), 1120px); margin:0 auto; min-height:66px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:24px; }
          .brand { display:inline-flex; align-items:center; gap:10px; color:var(--mb-fg); font-size:15px; font-weight:700; text-decoration:none; white-space:nowrap; }
          .brand img { width:28px; height:28px; display:block; }
          .links { display:flex; align-items:center; justify-content:center; gap:22px; min-width:0; overflow-x:auto; scrollbar-width:none; font-size:14px; white-space:nowrap; }
          .links::-webkit-scrollbar { display:none; }
          .links a, .sub a { color:var(--mb-dim); text-decoration:none; transition:color .15s; }
          .links a:hover, .sub a:hover, .links a.active, .sub a.active { color:var(--mb-fg); }
          .links a.active, .sub a.active { font-weight:700; }
          .cta { display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 14px; border-radius:8px; background:var(--mb-accent); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; white-space:nowrap; }
          .cta:hover { background:var(--mb-accent-dim); color:#ffffff; }
          .sub { width:min(calc(100% - 48px), 1120px); margin:0 auto; padding:0 0 12px; display:flex; gap:18px; flex-wrap:wrap; font-size:12px; }
          @media (max-width:760px) {
            .inner { width:min(calc(100% - 32px), 1120px); grid-template-columns:1fr auto; min-height:auto; padding:14px 0 10px; gap:12px; }
            .brand span { display:none; }
            .links { grid-column:1 / -1; justify-content:flex-start; }
          }
        </style>
        <header class="hdr">
          <div class="inner">
            <a class="brand" href="${BRAND_HREF}" aria-label="강대종 작업장 홈"><img src="${BADGE}" alt="" width="28" height="28"/><span>강대종 작업장</span></a>
            <div class="links">${primary}</div>
            <a class="cta" href="mailto:minusbetastudio@gmail.com">문의</a>
          </div>
          <div class="sub">${secondary}</div>
        </header>`;
    }
  }

  class MbFooter extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${PALETTE} display:block; }
          footer { border-top:1px solid var(--mb-border); max-width:1120px; margin:72px auto 0; padding:32px 24px 64px; font-family:var(--mb-mono); font-size:12px; color:var(--mb-dim); }
          .links { display:flex; gap:18px; flex-wrap:wrap; margin-bottom:18px; }
          .links a { color:var(--mb-dim); text-decoration:none; transition:color .15s; }
          .links a:hover { color:var(--mb-fg); }
          .biz { display:flex; flex-direction:column; gap:4px; color:var(--mb-mute); }
          .copy { margin-top:16px; color:var(--mb-mute); }
        </style>
        <footer>
          <div class="links">
            <a href="https://github.com/ssamssae" target="_blank" rel="noopener">GitHub</a>
            <a href="https://work.kangdaejong.com/">작업장</a>
            <a href="mailto:minusbetastudio@gmail.com">minusbetastudio@gmail.com</a>
          </div>
          <div class="biz">
            <span>마이너스베타스튜디오 · 대표 강대종</span>
            <span>사업자등록번호 878-21-02478</span>
            <span>통신판매업신고번호 제 2026-서울마포-1177 호</span>
            <span>서울특별시 마포구 만리재로10길 4 (공덕동)</span>
            <span>정보통신업 / 응용 소프트웨어 개발 및 공급업</span>
          </div>
          <div class="copy">© 2026 마이너스베타스튜디오. All rights reserved.</div>
        </footer>`;
    }
  }

  customElements.define('mb-header', MbHeader);
  customElements.define('mb-footer', MbFooter);
})();
