/* 마이너스베타스튜디오 공통 헤더/푸터 — 회사 홈과 founder가 함께 쓰는 정본. */
(function () {
  const BADGE = 'https://kangdaejong.com/brand/current/logo.svg';
  const BRAND_HREF = 'https://kangdaejong.com/';

  // active = home|projects|products|contact|catalog|tools|protein|organization|founder|system|workshop|worklog|newsletter|timeline|work-system|lab
  const NAV_PRIMARY = [
    { key: 'projects', label: '프로젝트', href: 'https://kangdaejong.com/#projects' },
    { key: 'products', label: '앱', href: 'https://kangdaejong.com/#products' },
    { key: 'contact', label: '연락', href: 'https://kangdaejong.com/#contact' },
  ];
  const NAV_GROUPS = [
    { label: '제품과 도구', items: [
      { key: 'catalog', label: '전체 제품', href: 'https://kangdaejong.com/work/products/' },
      { key: 'tools', label: '공개 도구', href: 'https://kangdaejong.com/work/products/?category=tool#catalog' },
      { key: 'guides', label: '제품 사용 안내', href: 'https://kangdaejong.com/product/' },
    ] },
    { label: '회사 소개', items: [
      { key: 'organization', label: '스튜디오 소개', description: '누가 만들고 책임지는지', href: 'https://kangdaejong.com/organization/' },
      { key: 'founder', label: '대표 소개', description: '만드는 사람, 강대종', href: 'https://kangdaejong.com/founder/' },
      { key: 'system', label: '만드는 방식', description: '기획부터 출시까지의 원칙', href: 'https://kangdaejong.com/system/' },
    ] },
    { label: '작업과 기록', items: [
      { key: 'workshop', label: '작업장', description: '최근 작업과 이야기 한눈에', href: 'https://kangdaejong.com/work/' },
      { key: 'worklog', label: '작업일지', description: '날마다 만든 것과 고친 것', href: 'https://kangdaejong.com/work/worklog/' },
      { key: 'newsletter', label: '뉴스레터', description: '과정에서 건진 이야기', href: 'https://kangdaejong.com/work/newsletter/' },
      { key: 'timeline', label: '타임라인', description: '처음부터 지금까지의 변화', href: 'https://kangdaejong.com/work/timeline/' },
    ] },
    { label: '시스템과 실험', items: [
      { key: 'work-system', label: '개발·운영 시스템', description: '작업을 지탱하는 도구와 구조', href: 'https://kangdaejong.com/work/system/' },
      { key: 'lab', label: '실험실', description: '시험해 본 것과 배운 점', href: 'https://kangdaejong.com/work/lab/' },
      { key: 'protein', label: '단백질', description: '아미노산 구조를 살펴보는 실험', href: 'https://kangdaejong.com/protein/' },
    ] },
  ];

  const PALETTE_DEFAULT = `
    --mb-bg:var(--mb-host-bg); --mb-elev:var(--mb-host-elev); --mb-fg:var(--mb-host-fg); --mb-dim:var(--mb-host-dim); --mb-mute:var(--mb-host-mute);
    --mb-border:var(--mb-host-border); --mb-soft:var(--mb-host-soft); --mb-accent:var(--mb-host-accent);
    --mb-cta-bg:var(--mb-host-cta-bg); --mb-cta-fg:var(--cta-fg); --mb-shadow:var(--mb-host-shadow);
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
    --mb-serif:'Noto Serif KR','Iropke Batang',Georgia,serif;
  `;
  // T-261011-068: studio tone follows the host page's --mb-host-* variables from the shared tokens.css
  // (every company site loads it). T-261024-050: 모양·글자 크기도 같은 파일의 --tone-* 를 그대로 읽는다 —
  // 회사 홈은 <html data-theme="light"> 라 라이트 값, 작업장·대표소개는 기기 설정을 따른다.
  const PALETTE_STUDIO = `
    --mb-bg:var(--mb-host-bg); --mb-elev:var(--mb-host-elev); --mb-fg:var(--mb-host-fg); --mb-dim:var(--mb-host-dim); --mb-mute:var(--mb-host-mute);
    --mb-border:var(--mb-host-border); --mb-soft:var(--mb-host-soft); --mb-accent:var(--mb-host-accent);
    --mb-cta-bg:var(--mb-host-cta-bg); --mb-cta-fg:var(--cta-fg); --mb-shadow:var(--mb-host-shadow);
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
      const mountedWork = location.hostname === 'kangdaejong.com' && (location.pathname === '/work' || location.pathname.startsWith('/work/'));
      const path = mountedWork ? location.pathname.slice('/work'.length) || '/' : location.pathname;
      if (mountedWork || location.hostname === 'work.kangdaejong.com') {
        if (path.startsWith('/products')) active = new URLSearchParams(location.search).get('category') === 'tool' ? 'tools' : 'products';
        else if (path.startsWith('/lab')) active = 'lab';
        else if (path.startsWith('/timeline')) active = 'timeline';
        else if (active === 'system') active = 'work-system';
      }
      const localHome = location.pathname === '/' && location.hostname !== 'work.kangdaejong.com' && (location.hostname === 'kangdaejong.com' || location.hostname === '127.0.0.1' || location.hostname === 'localhost');
      const makeLink = (item) => `<a href="${localHome && item.href.startsWith(BRAND_HREF + '#') ? item.href.slice(BRAND_HREF.length) : item.href}"${item.newWindow ? ' target="_blank" rel="noopener noreferrer"' : ''}${item.key === active ? ' class="active" aria-current="page"' : ''}><span class="link-title">${item.label}${item.newWindow ? '<span class="external-arrow" aria-hidden="true">↗</span>' : ''}${item.key === active ? '<span class="current">현재 위치</span>' : ''}</span>${item.description ? `<small>${item.description}</small>` : ''}</a>`;
      const moreActive = NAV_GROUPS.some(group => group.items.some(item => item.key === active));
      // T-261024-062: 실제 헤더 높이를 문서 변수 --mb-header-block 으로 알린다 — 고정 헤더 아래로 앵커·초점이 숨지 않게 호스트 문서(studio-page.css 등)가 scroll-padding 에 쓴다.
      //   휴대전화 두 줄 헤더·언어 버튼처럼 폭에 따라 높이가 달라져도 CSS 식 대신 실측값이 들어간다(ResizeObserver 가 첫 관측부터 알린다).
      const publishHeight = () => document.documentElement.style.setProperty('--mb-header-block', `${this.offsetHeight}px`);
      if (typeof ResizeObserver === 'function') new ResizeObserver(publishHeight).observe(this); else requestAnimationFrame(publishHeight);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          /* T-261024-062: 대종님 「헤더가 아래로 내려가면 안보이는데 틀고정 효과로 헤더가 항상 위로 보이게」 — 호스트를 sticky 로 화면 위에 붙인다.
             4면(회사 홈·작업장·대표소개·단백질)이 이 파일을 실행 시점에 읽으므로 여기 한 곳이면 된다. 둘러보기 판은 .header 기준 absolute 라 같이 따라온다.
             앵커 이동이 헤더에 가려지지 않게 studio-page.css 가 html scroll-padding-top 을 헤더 높이로 둔다. */
          :host { ${hostPalette(this)} display:block; position:sticky; top:0; z-index:70; line-height:1.5; letter-spacing:normal; }
          * { box-sizing:border-box; }
          /* T-261024-050: 첫이름(토스 톤) 헤더 — 높이·글자·간격·모서리는 호스트 문서가 읽는 공용 톤 파일(--tone-*)의 이름만 쓴다. 숫자를 여기 다시 적지 않는다. */
          .header { position:relative; z-index:70; border-bottom:1px solid var(--mb-border); background:var(--mb-bg); font-family:var(--tone-font); }
          .inner { width:min(calc(100% - var(--tone-gutter) * 2),var(--mb-max)); min-height:var(--tone-header-height); margin:0 auto; display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:var(--tone-space-3); }
          .brand { display:inline-flex; align-items:center; gap:10px; min-height:var(--tone-tap-height); color:var(--mb-fg); font:var(--tone-weight-bold) var(--tone-subtitle-size)/var(--tone-subtitle-line) var(--tone-font); letter-spacing:var(--tone-tracking-title); text-decoration:none; white-space:nowrap; }
          .brand img { width:32px; height:32px; display:block; }
          .brand small { display:block; color:var(--mb-dim); font:var(--tone-weight) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); letter-spacing:normal; }
          .links { display:flex; justify-content:center; align-items:center; gap:var(--tone-space-1); min-width:0; white-space:nowrap; }
          .links a { display:inline-flex; align-items:center; min-height:var(--tone-tap-height); padding:0 var(--tone-space-1); color:var(--mb-fg); font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); text-decoration:none; }
          .links a:hover,.links a.active { color:var(--mb-accent); }
          .links .current { display:none; }
          .actions { display:flex; align-items:center; gap:var(--tone-space-1); }
          .more-button,.panel-close { display:inline-flex; align-items:center; justify-content:center; min-height:var(--tone-tap-height); padding:0 var(--tone-space-1); border:0; border-radius:var(--tone-radius-control); background:transparent; color:var(--mb-fg); cursor:pointer; font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); }
          .more-button:hover,.more-button.active,.more.open .more-button { color:var(--mb-accent); }
          .panel-close { min-width:58px; padding:0 var(--tone-space-2); background:var(--mb-soft); }
          .chevron { display:inline-block; margin-left:6px; font-size:var(--tone-caption-size); transition:transform .16s ease; }
          .more.open .chevron { transform:rotate(180deg); }
          .more-panel { position:absolute; right:max(var(--tone-gutter),calc((100% - var(--mb-max))/2)); top:calc(100% + var(--tone-space-1)); width:min(780px,calc(100% - var(--tone-gutter) * 2)); padding:var(--tone-card-padding); border:1px solid var(--mb-border); background:var(--mb-bg); border-radius:var(--tone-radius-sheet); box-shadow:0 18px 55px var(--mb-shadow); max-height:calc(100dvh - var(--tone-header-height) * 2); overflow-y:auto; overscroll-behavior:contain; }
          .more-panel[hidden] { display:none; }
          .panel-heading { display:flex; justify-content:space-between; align-items:center; gap:var(--tone-space-3); padding-bottom:var(--tone-space-3); border-bottom:1px solid var(--mb-border); }
          .panel-heading strong { font:var(--tone-weight-bold) var(--tone-subtitle-size)/var(--tone-subtitle-line) var(--tone-font); letter-spacing:var(--tone-tracking-title); }
          .panel-heading p { margin:4px 0 0; color:var(--mb-dim); font:var(--tone-weight) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); }
          .menu-groups { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--tone-space-4) var(--tone-space-3); padding-top:var(--tone-space-3); }
          .menu-group h2 { margin:0 var(--tone-space-2) var(--tone-space-1); color:var(--mb-dim); font:var(--tone-weight-bold) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); letter-spacing:normal; }
          .menu-group a { display:block; min-height:var(--tone-control-height); padding:var(--tone-space-2); border-radius:var(--tone-radius-control); color:var(--mb-fg); text-decoration:none; }
          .menu-group a:hover,.menu-group a.active { background:var(--mb-soft); }
          .menu-group a.active .link-title { color:var(--mb-accent); }
          .link-title { display:flex; align-items:center; gap:7px; font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); }
          .menu-group small { display:block; margin-top:2px; color:var(--mb-dim); font:var(--tone-weight) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); word-break:keep-all; }
          .external-arrow { color:var(--mb-mute); }
          .current { margin-left:auto; color:var(--mb-accent); font:var(--tone-weight-bold) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); white-space:nowrap; }
          .contact { display:inline-flex; min-height:var(--tone-tap-height); align-items:center; justify-content:center; padding:0 var(--tone-space-3); border:0; border-radius:var(--tone-radius-control); background:var(--mb-soft); color:var(--mb-fg); font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); text-decoration:none; }
          .contact:hover { color:var(--mb-accent); }
          .lang { display:inline-flex; align-items:center; gap:2px; padding:3px; border:0; border-radius:var(--tone-radius-pill); background:var(--mb-soft); }
          .lang-button { min-height:38px; padding:0 var(--tone-space-2); border:0; border-radius:var(--tone-radius-pill); background:transparent; color:var(--mb-dim); cursor:pointer; font:var(--tone-weight-bold) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); }
          .lang-button:hover { color:var(--mb-accent); }
          .lang-button[aria-pressed="true"] { background:var(--mb-bg); color:var(--mb-accent); }
          :where(a,button):focus-visible { outline:var(--tone-focus-width) solid var(--mb-accent); outline-offset:var(--tone-focus-offset); }
          @media(max-width:650px) {
            /* 첫이름 휴대전화 헤더처럼 두 줄: 상호·둘러보기 줄, 그 아래 메뉴 줄. */
            .inner { width:calc(100% - 40px); min-height:0; padding-block:var(--tone-space-1); grid-template-columns:1fr auto; grid-template-areas:"brand actions" "links links"; gap:0 var(--tone-space-2); }
            .brand { grid-area:brand; }.brand small { display:none; }
            .actions { grid-area:actions; }
            .links { grid-area:links; justify-content:flex-start; gap:0; margin-left:calc(var(--tone-space-1) * -1); }
            .more-panel { right:var(--tone-space-2); width:calc(100% - var(--tone-space-4)); padding:var(--tone-space-3); }
            .menu-groups { gap:var(--tone-space-3) var(--tone-space-1); }.menu-group a { padding:var(--tone-space-1); }.current { display:none; }
          }
          @media(max-width:380px) { .brand { gap:var(--tone-space-1); font-size:var(--tone-label-size); line-height:var(--tone-label-line); }.brand img { width:24px; height:24px; }.lang-button { padding:0 var(--tone-space-1); }.more-button { padding:0 4px; } }
          @media(prefers-reduced-motion:reduce) { .chevron { transition:none; } }
        </style>
        <header class="header">
          <div class="inner">
            <a class="brand" href="${BRAND_HREF}" aria-label="강대종 홈"><img src="${BADGE}" alt="" width="32" height="32"/><span>강대종<small>마이너스베타스튜디오</small></span></a>
            <nav class="links" aria-label="주요 메뉴">${NAV_PRIMARY.map(makeLink).join('')}</nav>
            <div class="actions">
              ${this.hasAttribute('lang-toggle') ? `<div class="lang" role="group" aria-label="언어 선택"><button class="lang-button" type="button" data-lang="ko" lang="ko" aria-pressed="true" data-i18n-skip>한국어</button><button class="lang-button" type="button" data-lang="en" lang="en" aria-pressed="false" data-i18n-skip>EN</button></div>` : ''}
              <div class="more">
                <button class="more-button${moreActive ? ' active' : ''}" type="button" aria-expanded="false" aria-controls="studio-navigation">둘러보기<span class="chevron" aria-hidden="true">⌄</span></button>
                <nav class="more-panel" id="studio-navigation" aria-label="스튜디오 둘러보기" hidden>
                  <div class="panel-heading"><div><strong>스튜디오 둘러보기</strong><p>만드는 사람부터 작업 과정까지.</p></div><button class="panel-close" type="button" aria-label="둘러보기 닫기">닫기 ×</button></div>
                  <div class="menu-groups">${NAV_GROUPS.map(group => `<section class="menu-group"><h2>${group.label}</h2>${group.items.map(makeLink).join('')}</section>`).join('')}</div>
                </nav>
              </div>

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
      // T-261011-068: optional 한국어/EN toggle. The host page listens for mb-lang-change and swaps its copy.
      const langGroup = root.querySelector('.lang');
      if (langGroup) {
        this._paintLang = () => {
          const current = this.getAttribute('lang') || 'ko';
          langGroup.querySelectorAll('.lang-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === current)));
        };
        langGroup.addEventListener('click', event => {
          const button = event.target.closest('.lang-button');
          if (!button) return;
          this.setAttribute('lang', button.dataset.lang);
          this.dispatchEvent(new CustomEvent('mb-lang-change', { detail: { lang: button.dataset.lang }, bubbles: true, composed: true }));
        });
        this._paintLang();
      }
    }
    static get observedAttributes() { return ['lang']; }
    attributeChangedCallback() { if (this._paintLang) this._paintLang(); }
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
          /* T-261024-050: 첫이름 footer — 위 가는 줄, 13/18 회색 글, 링크는 15/22 굵게 44px. 값은 공용 톤 파일(--tone-*) 이름만. */
          footer { width:min(calc(100% - var(--tone-gutter) * 2),var(--mb-max)); margin:var(--tone-section-gap) auto 0; padding:var(--tone-space-4) 0 var(--tone-space-6); border-top:1px solid var(--mb-border); color:var(--mb-dim); font:var(--tone-weight) var(--tone-caption-size)/var(--tone-caption-line) var(--tone-font); overflow-wrap:anywhere; }
          .foot-head { display:flex; align-items:center; justify-content:space-between; gap:var(--tone-space-3); margin-bottom:var(--tone-space-3); }
          .foot-head strong { color:var(--mb-fg); font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); }
          .foot-head a { display:inline-flex; align-items:center; min-height:var(--tone-tap-height); color:var(--mb-fg); font:var(--tone-weight-bold) var(--tone-label-size)/var(--tone-label-line) var(--tone-font); text-decoration:none; }
          .foot-head a:hover { color:var(--mb-accent); }
          .biz { display:flex; flex-wrap:wrap; gap:var(--tone-space-1) var(--tone-space-3); }
          .copy { margin-top:var(--tone-space-3); color:var(--mb-mute); }
          :where(a):focus-visible { outline:var(--tone-focus-width) solid var(--mb-accent); outline-offset:var(--tone-focus-offset); }
          @media (max-width:640px) {
            .foot-head { display:block; }
            .foot-head a { margin-top:4px; }
            .biz { display:grid; gap:4px; }
          }
        </style>
        <footer>
          <div class="foot-head">
            <strong>마이너스베타스튜디오</strong>
            <a href="mailto:minusbetastudio@gmail.com">minusbetastudio@gmail.com</a>
          </div>
          <div class="biz">
            <span>마이너스베타스튜디오 · 대표 강대종</span>
            <span>사업자등록번호 878-21-02478</span>
            <span>호스팅 서비스 제공자 Cloudflare, Inc.</span>
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
