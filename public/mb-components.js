/* 마이너스베타스튜디오 공통 헤더/푸터 — 회사 홈과 founder가 함께 쓰는 정본. */
(function () {
  const BADGE = 'https://kangdaejong.com/minusbeta-badge.svg?v=square';
  const BRAND_HREF = 'https://kangdaejong.com/';

  // active = home|products|books|tools|protein|organization|system|workshop|worklog|newsletter|founder
  const NAV_PRIMARY = [
    { key: 'products', label: '제품', href: 'https://work.kangdaejong.com/products/' },
    { key: 'books', label: '책·템플릿', href: 'https://kangdaejong.com/#books' },
    { key: 'tools', label: '공개 도구', href: 'https://work.kangdaejong.com/products/?category=tool#catalog' },
    { key: 'protein', label: '단백질', href: 'https://protein.kangdaejong.com/' },
  ];
  const NAV_GROUPS = [
    { label: '회사 소개', items: [
      { key: 'organization', label: '회사·조직도', description: '누가 만들고 책임지는지', href: 'https://kangdaejong.com/organization/' },
      { key: 'founder', label: '대표 소개', description: '만드는 사람, 강대종', href: 'https://founder.kangdaejong.com/' },
      { key: 'system', label: '만드는 방식', description: '기획부터 출시까지의 원칙', href: 'https://kangdaejong.com/system/' },
    ] },
    { label: '작업과 기록', items: [
      { key: 'workshop', label: '작업장', description: '최근 작업과 이야기 한눈에', href: 'https://work.kangdaejong.com/' },
      { key: 'worklog', label: '작업일지', description: '날마다 만든 것과 고친 것', href: 'https://work.kangdaejong.com/worklog' },
      { key: 'newsletter', label: '뉴스레터', description: '과정에서 건진 이야기 · 새 탭', href: 'https://minusbetastudio.substack.com', newWindow: true },
      { key: 'timeline', label: '타임라인', description: '처음부터 지금까지의 변화', href: 'https://work.kangdaejong.com/timeline.html/' },
    ] },
    { label: '시스템과 실험', items: [
      { key: 'work-system', label: '개발·운영 시스템', description: '작업을 지탱하는 도구와 구조', href: 'https://work.kangdaejong.com/system/' },
      { key: 'lab', label: '실험실', description: '시험해 본 것과 배운 점', href: 'https://work.kangdaejong.com/lab/' },
      { key: 'choso', label: '초소', description: '공개된 운영 현황 둘러보기', href: 'https://choso.kangdaejong.com/guest' },
    ] },
  ];

  const PALETTE_DEFAULT = `
    --mb-bg:#f7f6f2; --mb-elev:#eeede7; --mb-fg:#242720; --mb-dim:#62655d; --mb-mute:#707369;
    --mb-border:#d8d8ce; --mb-soft:#eeede7; --mb-accent:#b8452b;
    --mb-cta-bg:#c64b2e; --mb-cta-fg:#fffaf3;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
    --mb-serif:'Noto Serif KR','Iropke Batang',Georgia,serif;
  `;
  const PALETTE_STUDIO = `
    --mb-bg:#f7f6f2; --mb-elev:#eeede7; --mb-fg:#242720; --mb-dim:#62655d; --mb-mute:#707369;
    --mb-border:#d8d8ce; --mb-soft:#eeede7; --mb-accent:#b8452b;
    --mb-cta-bg:#c64b2e; --mb-cta-fg:#fffaf3;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
    --mb-serif:'Noto Serif KR','Iropke Batang',Georgia,serif;
  `;
  const hostTone = (element) => element.getAttribute('tone') || element.dataset.tone || '';
  const hostPalette = (element) => hostTone(element) === 'studio' ? PALETTE_STUDIO : PALETTE_DEFAULT;

  class MbHeader extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      let active = this.getAttribute('active') || '';
      const path = location.pathname;
      if (location.hostname === 'work.kangdaejong.com') {
        if (path.startsWith('/products')) active = new URLSearchParams(location.search).get('category') === 'tool' ? 'tools' : 'products';
        else if (path.startsWith('/lab')) active = 'lab';
        else if (path.startsWith('/timeline')) active = 'timeline';
        else if (active === 'system') active = 'work-system';
      }
      const makeLink = (item) => `<a href="${item.href}"${item.newWindow ? ' target="_blank" rel="noopener noreferrer"' : ''}${item.key === active ? ' class="active" aria-current="page"' : ''}><span class="link-title">${item.label}${item.newWindow ? '<span class="external-arrow" aria-hidden="true">↗</span>' : ''}${item.key === active ? '<span class="current">현재 위치</span>' : ''}</span>${item.description ? `<small>${item.description}</small>` : ''}</a>`;
      const moreActive = NAV_GROUPS.some(group => group.items.some(item => item.key === active));
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; line-height:1.5; letter-spacing:normal; }
          * { box-sizing:border-box; }
          .header { position:relative; z-index:70; border-bottom:1px solid var(--mb-border); background:var(--mb-bg); font-family:var(--mb-sans); }
          .inner { width:min(calc(100% - 96px),1280px); min-height:88px; margin:0 auto; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:28px; }
          .brand { display:inline-flex; align-items:center; gap:11px; color:var(--mb-fg); font-size:21px; font-weight:750; text-decoration:none; white-space:nowrap; }
          .brand img { width:43px; height:43px; display:block; }
          .brand small { display:block; font-size:10px; font-weight:450; color:var(--mb-mute); margin-top:4px; }
          .links { display:flex; justify-content:center; align-items:center; gap:22px; min-width:0; font-size:13px; white-space:nowrap; }
          .links a { display:flex; align-items:center; min-height:44px; color:var(--mb-dim); text-decoration:none; }
          .links a:hover,.links a.active { color:var(--mb-accent); }
          .links a.active { box-shadow:inset 0 -2px var(--mb-accent); font-weight:600; }
          .links .current { display:none; }
          .actions { display:flex; align-items:center; gap:10px; }
          .more-button,.panel-close { min-height:44px; border:1px solid var(--mb-border); border-radius:9px; background:transparent; color:var(--mb-fg); cursor:pointer; font:600 13px var(--mb-sans); }
          .more-button { padding:0 13px; }
          .more-button:hover,.more-button.active,.more.open .more-button { background:var(--mb-soft); border-color:var(--mb-accent); color:var(--mb-accent); }
          .chevron { display:inline-block; margin-left:7px; font-size:10px; transition:transform .16s ease; }
          .more.open .chevron { transform:rotate(180deg); }
          .more-panel { position:absolute; right:max(24px,calc((100% - 1280px)/2)); top:calc(100% + 8px); width:min(780px,calc(100% - 48px)); padding:22px; border:1px solid var(--mb-border); background:var(--mb-bg); border-radius:18px; box-shadow:0 18px 55px #24272026; max-height:calc(100dvh - 120px); overflow-y:auto; overscroll-behavior:contain; }
          .more-panel[hidden] { display:none; }
          .panel-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; padding-bottom:16px; border-bottom:1px solid var(--mb-border); }
          .panel-heading strong { font-size:17px; letter-spacing:-.03em; }
          .panel-heading p { margin:4px 0 0; font-size:12px; color:var(--mb-dim); }
          .panel-close { min-width:58px; padding:0 10px; }
          .menu-groups { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; padding-top:18px; }
          .menu-group h2 { font-size:11px; letter-spacing:.04em; margin:0 10px 10px; color:var(--mb-accent); }
          .menu-group a { display:block; min-height:62px; padding:10px; border-radius:9px; color:var(--mb-fg); text-decoration:none; }
          .menu-group a:hover,.menu-group a.active { background:var(--mb-soft); }
          .menu-group a.active { box-shadow:inset 3px 0 var(--mb-accent); }
          .link-title { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; }
          .menu-group small { display:block; margin-top:4px; color:var(--mb-dim); font-size:11px; line-height:1.6; word-break:keep-all; }
          .external-arrow { color:var(--mb-mute); }
          .current { margin-left:auto; font-size:9px; font-weight:500; white-space:nowrap; color:var(--mb-accent); }
          .contact { display:inline-flex; min-height:44px; align-items:center; justify-content:center; padding:0 14px; border:1px solid var(--mb-border); border-radius:9px; color:var(--mb-fg); font-size:13px; font-weight:600; text-decoration:none; }
          .contact:hover { border-color:var(--mb-accent); color:var(--mb-accent); }
          :where(a,button):focus-visible { outline:2px solid var(--mb-accent); outline-offset:3px; }
          @media(max-width:1000px) { .inner { gap:16px; width:calc(100% - 48px); }.brand small { display:none; }.links { gap:15px; }.brand { font-size:18px; } }
          @media(max-width:760px) {
            .inner { min-height:auto; padding:12px 0 4px; grid-template-columns:1fr auto; gap:8px 14px; }
            .brand span { display:none; }.brand img { width:38px; height:38px; }
            .links { grid-column:1 / -1; grid-row:2; justify-content:flex-start; gap:22px; overflow-x:auto; scrollbar-width:none; }
            .links::-webkit-scrollbar { display:none; }.actions { grid-column:2; grid-row:1; }
            .more-panel { width:calc(100% - 24px); right:12px; padding:16px; top:calc(100% + 6px); max-height:calc(100dvh - 140px); }
            .menu-groups { grid-template-columns:1fr; gap:16px; }.menu-group { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px; }
            .menu-group h2 { grid-column:1 / -1; margin-bottom:4px; }.menu-group a { padding:9px; }.link-title { flex-wrap:wrap; }.current { margin-left:0; }
          }
          @media(max-width:390px) { .inner { width:calc(100% - 32px); }.contact { padding:0 11px; }.menu-groups { gap:12px; }.menu-group small { font-size:11px; } }
          @media(prefers-reduced-motion:reduce) { .chevron { transition:none; } }
        </style>
        <header class="header">
          <div class="inner">
            <a class="brand" href="${BRAND_HREF}" aria-label="마이너스베타스튜디오 홈"><img src="${BADGE}" alt="" width="43" height="43"/><span>minus beta<small>독립적인 생각, 쓸모 있는 제품.</small></span></a>
            <nav class="links" aria-label="주요 메뉴">${NAV_PRIMARY.map(makeLink).join('')}</nav>
            <div class="actions">
              <div class="more">
                <button class="more-button${moreActive ? ' active' : ''}" type="button" aria-expanded="false" aria-controls="studio-navigation">둘러보기<span class="chevron" aria-hidden="true">⌄</span></button>
                <nav class="more-panel" id="studio-navigation" aria-label="스튜디오 둘러보기" hidden>
                  <div class="panel-heading"><div><strong>스튜디오 둘러보기</strong><p>만드는 사람부터 작업 과정까지.</p></div><button class="panel-close" type="button" aria-label="둘러보기 닫기">닫기 ×</button></div>
                  <div class="menu-groups">${NAV_GROUPS.map(group => `<section class="menu-group"><h2>${group.label}</h2>${group.items.map(makeLink).join('')}</section>`).join('')}</div>
                </nav>
              </div>
              <a class="contact" href="mailto:minusbetastudio@gmail.com">문의</a>
            </div>
          </div>
        </header>`;
      const more = root.querySelector('.more');
      const button = root.querySelector('.more-button');
      const menu = root.querySelector('.more-panel');
      const closeMenu = (restoreFocus = false) => {
        menu.hidden = true;
        more.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        if (restoreFocus) button.focus();
      };
      const openMenu = () => {
        menu.hidden = false;
        more.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      };
      button.addEventListener('click', () => menu.hidden ? openMenu() : closeMenu());
      button.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); openMenu(); menu.querySelector('a').focus(); }
      });
      root.querySelector('.panel-close').addEventListener('click', () => closeMenu(true));
      menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
      root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); closeMenu(true); }
      });
      root.addEventListener('focusout', event => { if (event.relatedTarget && !more.contains(event.relatedTarget)) closeMenu(); });
      this._outsideClick = event => { if (!event.composedPath().includes(this)) closeMenu(); };
      this._outsideFocus = event => { if (!event.composedPath().includes(this)) closeMenu(); };
      document.addEventListener('click', this._outsideClick);
      document.addEventListener('focusin', this._outsideFocus);
    }
    disconnectedCallback() {
      document.removeEventListener('click', this._outsideClick);
      document.removeEventListener('focusin', this._outsideFocus);
    }
  }

  class MbFooter extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; }
          footer { width:min(calc(100% - 96px),1280px); margin:0 auto; padding:42px 0 58px; border-top:1px solid var(--mb-border); color:var(--mb-mute); font-family:var(--mb-sans); font-size:12px; line-height:1.7; }
          .foot-head { display:flex; align-items:baseline; justify-content:space-between; gap:20px; margin-bottom:18px; }
          .foot-head strong { color:var(--mb-fg); font-family:var(--mb-sans); font-size:21px; font-weight:750; }
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
