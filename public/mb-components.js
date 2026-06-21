/*
 * 마이너스베타스튜디오 공통 헤더/푸터 (single source of truth)
 * 세 사이트(kangdaejong.com / founder / work)가 이 파일 하나를 불러 씁니다.
 * 메뉴·색·회사정보를 여기서만 고치면 세 사이트에 동시 반영됩니다.
 *
 * 사용법:
 *   <script src="https://kangdaejong.com/mb-components.js" defer></script>
 *   <mb-header active="home"></mb-header>   // active = home|founder|worklog|newsletter|insights|products|system|lab
 *   <mb-footer></mb-footer>
 */
(function () {
  const BADGE = 'https://kangdaejong.com/minusbeta-badge.svg';

  const NAV = [
    { key: 'home',       label: '회사소개',   href: 'https://kangdaejong.com/' },
    { key: 'founder',    label: '대표소개',   href: 'https://founder.kangdaejong.com/' },
    { key: 'worklog',    label: 'worklog',    href: 'https://work.kangdaejong.com/worklog' },
    { key: 'newsletter', label: 'newsletter', href: 'https://work.kangdaejong.com/newsletter' },
    { key: 'insights',   label: 'insights',   href: 'https://work.kangdaejong.com/insights' },
    { key: 'products',   label: 'products',   href: 'https://work.kangdaejong.com/products' },
    { key: 'system',     label: 'system',     href: 'https://work.kangdaejong.com/system' },
    { key: 'lab',        label: 'lab',        href: 'https://work.kangdaejong.com/lab' },
  ];

  // 공통 팔레트 (shadow DOM 안에서 자족 — 각 사이트 CSS 변수와 무관하게 동일하게 렌더)
  const PALETTE = `
    --mb-bg:#0a0a0a; --mb-fg:#f5f5f5; --mb-dim:#b9c0c9; --mb-mute:#8b95a1;
    --mb-border:#232323; --mb-cyan:#00e5ff; --mb-magenta:#ff00aa;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;
  `;

  class MbHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const links = NAV.map((n) =>
        `<a href="${n.href}"${n.key === active ? ' class="active" aria-current="page"' : ''}>${n.label}</a>`
      ).join('');
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${PALETTE} display:block; }
          .hdr { border-bottom:1px solid var(--mb-border); background:var(--mb-bg); position:sticky; top:0; z-index:50; }
          .inner { max-width:760px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; gap:10px 20px; flex-wrap:wrap; }
          .brand { display:inline-flex; align-items:center; flex:0 0 auto; }
          .brand img { width:30px; height:30px; display:block; }
          nav { display:flex; gap:18px; flex-wrap:wrap; font-family:var(--mb-mono); font-size:13px; }
          nav a { color:var(--mb-dim); text-decoration:none; transition:color .15s; }
          nav a:hover { color:var(--mb-cyan); }
          nav a.active { color:var(--mb-cyan); }
          @media (max-width:640px) { .inner { padding:12px 20px; gap:10px 14px; } nav { gap:13px; } }
        </style>
        <header class="hdr">
          <div class="inner">
            <a class="brand" href="https://kangdaejong.com/" aria-label="마이너스베타스튜디오"><img src="${BADGE}" alt="마이너스베타스튜디오" width="30" height="30"/></a>
            <nav>${links}</nav>
          </div>
        </header>`;
    }
  }

  class MbFooter extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${PALETTE} display:block; }
          footer { border-top:1px solid var(--mb-border); max-width:760px; margin:64px auto 0; padding:32px 24px 64px; font-family:var(--mb-mono); font-size:12px; color:var(--mb-dim); }
          .links { display:flex; gap:18px; flex-wrap:wrap; margin-bottom:18px; }
          .links a { color:var(--mb-dim); text-decoration:none; transition:color .15s; }
          .links a:hover { color:var(--mb-cyan); }
          .biz { display:flex; flex-direction:column; gap:4px; color:var(--mb-mute); }
          .copy { margin-top:16px; color:var(--mb-mute); }
        </style>
        <footer>
          <div class="links">
            <a href="https://github.com/ssamssae" target="_blank" rel="noopener">GitHub</a>
            <a href="https://work.kangdaejong.com/">작업일지</a>
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
