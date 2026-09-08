/* 마이너스베타스튜디오 공통 헤더/푸터 — 회사 홈과 founder가 함께 쓰는 정본. */
(function () {
  const BADGE = 'https://kangdaejong.com/minusbeta-badge.svg';
  const BRAND_HREF = 'https://kangdaejong.com/';

  // active = home|products|books|tools|organization|system|workshop|worklog|newsletter|founder
  const NAV_PRIMARY = [
    { key: 'products', label: '제품', href: 'https://kangdaejong.com/#products' },
    { key: 'books', label: '책·템플릿', href: 'https://kangdaejong.com/#books' },
    { key: 'tools', label: '공개 도구', href: 'https://kangdaejong.com/#open-tools' },
  ];
  const NAV_MORE = [
    { key: 'organization', label: '회사와 책임', href: 'https://kangdaejong.com/organization/' },
    { key: 'system', label: '만드는 방식', href: 'https://kangdaejong.com/system/' },
    { key: 'workshop', label: '작업장', href: 'https://work.kangdaejong.com/' },
    { key: 'worklog', label: '작업일지', href: 'https://work.kangdaejong.com/worklog' },
    { key: 'newsletter', label: '뉴스레터', href: 'https://minusbetastudio.substack.com' },
    { key: 'founder', label: '대표 소개', href: 'https://founder.kangdaejong.com/' },
  ];

  const PALETTE_DEFAULT = `
    --mb-bg:#08090A; --mb-elev:#0F1011; --mb-fg:#F7F8F8; --mb-dim:#D0D6E0; --mb-mute:#8A8F98;
    --mb-border:rgba(255,255,255,0.08); --mb-soft:#1C1C1F; --mb-accent:#7170FF;
    --mb-cta-bg:#E5E5E6; --mb-cta-fg:#08090A;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
    --mb-serif:'Noto Serif KR','Iropke Batang',Georgia,serif;
  `;
  const PALETTE_STUDIO = `
    --mb-bg:#11100e; --mb-elev:#181613; --mb-fg:#f5efe2; --mb-dim:#d2cabd; --mb-mute:#9f978b;
    --mb-border:rgba(245,239,226,.16); --mb-soft:#211e1a; --mb-accent:#d5a06f;
    --mb-cta-bg:#f2eadc; --mb-cta-fg:#17130f;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
    --mb-serif:'Noto Serif KR','Iropke Batang',Georgia,serif;
  `;
  const hostTone = (element) => element.getAttribute('tone') || element.dataset.tone || '';
  const hostPalette = (element) => hostTone(element) === 'studio' ? PALETTE_STUDIO : PALETTE_DEFAULT;

  class MbHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const makeLink = (item) =>
        `<a href="${item.href}"${item.key === active ? ' class="active" aria-current="page"' : ''}>${item.label}</a>`;
      const moreActive = NAV_MORE.some((item) => item.key === active);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; line-height:1.5; letter-spacing:normal; }
          .header { position:relative; z-index:70; border-bottom:1px solid var(--mb-border); background:var(--mb-bg); font-family:var(--mb-sans); }
          .inner { width:min(calc(100% - 112px),1320px); min-height:76px; margin:0 auto; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:32px; }
          .brand { display:inline-flex; align-items:center; gap:11px; color:var(--mb-fg); font-family:var(--mb-serif); font-size:15px; font-weight:600; text-decoration:none; white-space:nowrap; }
          .brand img { width:30px; height:30px; display:block; }
          .links { display:flex; justify-content:center; align-items:center; gap:26px; min-width:0; font-size:13px; white-space:nowrap; }
          .links a { color:var(--mb-mute); text-decoration:none; }
          .links a:hover,.links a.active { color:var(--mb-fg); }
          .links a.active { font-weight:600; }
          .actions { display:flex; align-items:center; gap:10px; }
          .more { position:relative; }
          .more-button { min-height:38px; padding:0 8px; border:0; background:transparent; color:var(--mb-dim); cursor:pointer; font-family:inherit; font-size:13px; }
          .more-button:hover,.more-button.active,.more.open .more-button { color:var(--mb-accent); }
          .chevron { display:inline-block; margin-left:5px; font-size:9px; transition:transform .16s ease; }
          .more.open .chevron { transform:rotate(180deg); }
          .more-panel { position:absolute; right:0; top:calc(100% + 9px); display:none; width:202px; padding:9px; border:1px solid var(--mb-border); background:var(--mb-bg); box-shadow:0 22px 60px rgba(0,0,0,.28); }
          .more.open .more-panel { display:grid; }
          .more-panel a { padding:10px 11px; color:var(--mb-dim); font-size:13px; text-decoration:none; }
          .more-panel a:hover,.more-panel a.active { background:var(--mb-soft); color:var(--mb-fg); }
          .more-panel a.active { font-weight:600; }
          .contact { display:inline-flex; min-height:38px; align-items:center; justify-content:center; padding:0 14px; border:1px solid var(--mb-border); color:var(--mb-fg); font-size:13px; font-weight:600; text-decoration:none; }
          .contact:hover { border-color:var(--mb-accent); color:var(--mb-accent); }
          :where(a,button):focus-visible { outline:2px solid var(--mb-accent); outline-offset:3px; }
          @media (max-width:760px) {
            .inner { width:min(calc(100% - 48px),1320px); min-height:auto; padding:13px 0 10px; grid-template-columns:1fr auto; gap:10px 14px; }
            .brand span { display:none; }
            .links { grid-column:1 / -1; grid-row:2; justify-content:flex-start; gap:19px; overflow-x:auto; scrollbar-width:none; }
            .links::-webkit-scrollbar { display:none; }
            .actions { grid-column:2; grid-row:1; }
          }
          @media (max-width:390px) {
            .inner { width:calc(100% - 40px); }
            .contact { padding:0 11px; }
          }
        </style>
        <header class="header">
          <div class="inner">
            <a class="brand" href="${BRAND_HREF}" aria-label="마이너스베타스튜디오 홈"><img src="${BADGE}" alt="" width="30" height="30"/><span>마이너스베타스튜디오</span></a>
            <nav class="links" aria-label="주요 메뉴">${NAV_PRIMARY.map(makeLink).join('')}</nav>
            <div class="actions">
              <div class="more">
                <button class="more-button${moreActive ? ' active' : ''}" type="button" aria-haspopup="true" aria-expanded="false">더보기<span class="chevron" aria-hidden="true">▾</span></button>
                <nav class="more-panel" aria-label="더보기 메뉴">${NAV_MORE.map(makeLink).join('')}</nav>
              </div>
              <a class="contact" href="mailto:minusbetastudio@gmail.com">문의</a>
            </div>
          </div>
        </header>`;

      const more = root.querySelector('.more');
      const button = root.querySelector('.more-button');
      const closeMenu = (restoreFocus = false) => {
        more.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        if (restoreFocus) button.focus();
      };
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = more.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
      });
      root.querySelector('.more-panel').addEventListener('click', (event) => event.stopPropagation());
      root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && more.classList.contains('open')) closeMenu(true);
      });
      document.addEventListener('click', () => closeMenu(false));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && more.classList.contains('open')) closeMenu(true);
      });
    }
  }

  class MbFooter extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; }
          footer { width:min(calc(100% - 112px),1320px); margin:0 auto; padding:42px 0 58px; border-top:1px solid var(--mb-border); color:var(--mb-mute); font-family:var(--mb-sans); font-size:12px; line-height:1.7; }
          .foot-head { display:flex; align-items:baseline; justify-content:space-between; gap:20px; margin-bottom:18px; }
          .foot-head strong { color:var(--mb-fg); font-family:var(--mb-serif); font-size:15px; font-weight:600; }
          .foot-head a { color:var(--mb-fg); text-decoration:none; }
          .foot-head a:hover { color:var(--mb-accent); }
          .biz { display:flex; flex-wrap:wrap; gap:6px 15px; }
          .copy { margin-top:18px; color:var(--mb-mute); }
          :where(a):focus-visible { outline:2px solid var(--mb-accent); outline-offset:3px; }
          @media (max-width:640px) {
            footer { width:calc(100% - 48px); padding:34px 0 44px; }
            .foot-head { display:block; }
            .foot-head a { display:inline-block; margin-top:7px; }
            .biz { display:grid; gap:4px; }
          }
          @media (max-width:390px) { footer { width:calc(100% - 40px); } }
        </style>
        <footer>
          <div class="foot-head">
            <strong>마이너스베타스튜디오</strong>
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

  if (!customElements.get('mb-header')) customElements.define('mb-header', MbHeader);
  if (!customElements.get('mb-footer')) customElements.define('mb-footer', MbFooter);
})();
