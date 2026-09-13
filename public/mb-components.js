/* 마이너스베타스튜디오 공통 헤더/푸터 — 회사 홈과 founder가 함께 쓰는 정본. */
(function () {
  const BADGE = 'https://kangdaejong.com/minusbeta-badge.svg?v=square';
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
    { key: 'workshop', label: '작업장', href: 'https://work.kangdaejong.com/', children: [
      { label: '작업장 둘러보기', description: '만들고 기록하는 공간', href: 'https://work.kangdaejong.com/' },
      { label: '실험실', description: '궁금해서 해본 것들', href: 'https://work.kangdaejong.com/lab/' },
      { label: '타임라인', description: '처음부터 지금까지', href: 'https://work.kangdaejong.com/timeline.html/' },
    ] },
    { key: 'worklog', label: '작업일지', href: 'https://work.kangdaejong.com/worklog' },
    { key: 'newsletter', label: '뉴스레터', href: 'https://minusbetastudio.substack.com', newWindow: true },
    { key: 'founder', label: '대표 소개', href: 'https://founder.kangdaejong.com/' },
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
      const active = this.getAttribute('active') || '';
      const makeLink = (item) => item.children
        ? `<div class="submenu">
            <button class="submenu-button${item.key === active ? ' active' : ''}" type="button" aria-expanded="false" aria-controls="workshop-panel">${item.label}<span aria-hidden="true">›</span></button>
            <nav class="submenu-panel" id="workshop-panel" aria-label="작업장 하위 메뉴" hidden>
              <p class="submenu-caption">만들고, 실험하고, 기록합니다.</p>
              ${item.children.map((child) => `<a href="${child.href}"><span>${child.label}<span class="submenu-arrow" aria-hidden="true">↗</span></span><small>${child.description}</small></a>`).join('')}
            </nav>
          </div>`
        : `<a href="${item.href}"${item.newWindow ? ' target="_blank" rel="noopener noreferrer"' : ''}${item.key === active ? ' class="active" aria-current="page"' : ''}>${item.label}${item.newWindow ? '<span class="external-arrow" aria-hidden="true">↗</span>' : ''}</a>`;
      const moreActive = NAV_MORE.some((item) => item.key === active);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; line-height:1.5; letter-spacing:normal; }
          .header { position:relative; z-index:70; border-bottom:1px solid var(--mb-border); background:var(--mb-bg); font-family:var(--mb-sans); }
          .inner { width:min(calc(100% - 96px),1280px); min-height:88px; margin:0 auto; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:32px; }
          .brand { display:inline-flex; align-items:center; gap:11px; color:var(--mb-fg); font-family:var(--mb-sans); font-size:21px; font-weight:750; text-decoration:none; white-space:nowrap; }
          .brand img { width:43px; height:43px; display:block; }
          .brand small { display:block; font-size:10px; font-weight:450; color:var(--mb-mute); margin-top:4px; }
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
          .more-panel { position:absolute; right:var(--menu-shift,0px); top:calc(100% + 9px); display:none; width:202px; padding:9px; border:1px solid var(--mb-border); background:var(--mb-bg); border-radius:16px; box-shadow:0 16px 40px #24272012; }
          .more.open .more-panel { display:grid; }
          .more-panel a { padding:10px 11px; border-radius:8px; color:var(--mb-dim); font-size:13px; text-decoration:none; }
          .more-panel a:hover,.more-panel a.active { background:var(--mb-soft); color:var(--mb-fg); }
          .more-panel a.active { font-weight:600; }
          .external-arrow { float:right; color:var(--mb-mute); }
          .submenu { position:relative; }
          .submenu-button { display:flex; align-items:center; justify-content:space-between; width:100%; padding:10px 11px; border:0; border-radius:8px; background:transparent; color:var(--mb-dim); font:inherit; font-size:13px; line-height:1.5; text-align:left; cursor:pointer; }
          .submenu-button > span { font-size:20px; line-height:1; }
          .submenu-button:hover,.submenu-button.active,.submenu-button[aria-expanded="true"] { background:var(--mb-soft); color:var(--mb-fg); }
          .submenu-button[aria-expanded="true"] { color:var(--mb-accent); }
          .submenu-panel { box-sizing:border-box; position:absolute; left:calc(100% + 19px); top:-10px; width:244px; padding:10px; border:1px solid var(--mb-border); border-radius:16px; background:var(--mb-bg); box-shadow:0 16px 40px #24272012; }
          .submenu-panel:not([hidden]) { display:grid; animation:submenu-in .14s ease-out; }
          .submenu-panel::before { content:''; position:absolute; right:100%; top:0; width:20px; height:100%; }
          .submenu-caption { margin:6px 11px 9px; color:var(--mb-mute); font-size:11px; }
          .submenu-panel a > span { display:flex; align-items:center; justify-content:space-between; gap:16px; font-weight:600; }
          .submenu-panel small { display:block; margin-top:3px; color:var(--mb-mute); font-size:11px; font-weight:400; }
          .submenu-arrow { color:var(--mb-mute); font-weight:400; }
          @keyframes submenu-in { from { opacity:0; transform:translateX(-4px); } to { opacity:1; transform:translateX(0); } }
          @media (prefers-reduced-motion:reduce) { .submenu-panel:not([hidden]) { animation:none; } }
          .contact { display:inline-flex; min-height:38px; align-items:center; justify-content:center; padding:0 14px; border:1px solid var(--mb-border); color:var(--mb-fg); font-size:13px; font-weight:600; text-decoration:none; }
          .contact:hover { border-color:var(--mb-accent); color:var(--mb-accent); }
          :where(a,button):focus-visible { outline:2px solid var(--mb-accent); outline-offset:3px; }
          @media (max-width:760px) {
            .more-panel { right:0; max-height:calc(100dvh - 130px); overflow-y:auto; }
            .submenu-panel { position:static; width:100%; margin:4px 0 6px; padding:4px; border:0; border-left:2px solid var(--mb-border); border-radius:0; box-shadow:none; }
            .submenu-panel::before { display:none; }
            .submenu-caption { display:none; }
            .submenu-button[aria-expanded="true"] > span { transform:rotate(90deg); }
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
            <a class="brand" href="${BRAND_HREF}" aria-label="마이너스베타스튜디오 홈"><img src="${BADGE}" alt="" width="30" height="30"/><span>minus beta<small>독립적인 생각, 쓸모 있는 제품.</small></span></a>
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
      const menu = root.querySelector('.more-panel');
      const submenu = root.querySelector('.submenu');
      const submenuButton = root.querySelector('.submenu-button');
      const submenuPanel = root.querySelector('.submenu-panel');
      let openedByHover = false;
      const positionSubmenu = () => {
        more.style.removeProperty('--menu-shift');
        if (submenuPanel.hidden || window.matchMedia('(max-width:760px)').matches) return;
        const overflow = submenuPanel.getBoundingClientRect().right - document.documentElement.clientWidth + 16;
        if (overflow > 0) more.style.setProperty('--menu-shift', `${Math.min(overflow, Math.max(0, menu.getBoundingClientRect().left - 16))}px`);
      };
      const closeSubmenu = (restoreFocus = false) => {
        openedByHover = false;
        submenuPanel.hidden = true;
        submenuButton.setAttribute('aria-expanded', 'false');
        more.style.removeProperty('--menu-shift');
        if (restoreFocus) submenuButton.focus();
      };
      const openSubmenu = (focusFirst = false) => {
        submenuPanel.hidden = false;
        submenuButton.setAttribute('aria-expanded', 'true');
        positionSubmenu();
        if (focusFirst) submenuPanel.querySelector('a').focus();
      };
      const closeMenu = (restoreFocus = false) => {
        closeSubmenu();
        more.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        if (restoreFocus) button.focus();
      };
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (more.classList.contains('open')) closeMenu();
        else {
          more.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
        }
      });
      submenuButton.addEventListener('click', () => {
        if (openedByHover) openedByHover = false;
        else if (submenuPanel.hidden) openSubmenu();
        else closeSubmenu();
      });
      submenuButton.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse' && window.matchMedia('(min-width:761px)').matches && submenuPanel.hidden) {
          openSubmenu();
          openedByHover = true;
        }
      });
      submenu.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' && event.target === submenuButton) {
          event.preventDefault();
          openSubmenu(true);
        } else if ((event.key === 'ArrowLeft' || event.key === 'Escape') && !submenuPanel.hidden) {
          event.preventDefault();
          event.stopPropagation();
          closeSubmenu(true);
        }
      });
      root.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!more.contains(root.activeElement)) closeMenu();
          else if (!submenu.contains(root.activeElement)) closeSubmenu();
        }, 0);
      });
      this._resizeMenu = positionSubmenu;
      window.addEventListener('resize', this._resizeMenu);
      root.querySelector('.more-panel').addEventListener('click', (event) => event.stopPropagation());
      root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && more.classList.contains('open')) closeMenu(true);
      });
      document.addEventListener('click', () => closeMenu(false));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && more.classList.contains('open')) closeMenu(true);
      });
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._resizeMenu);
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
