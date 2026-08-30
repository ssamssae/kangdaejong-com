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

  // A안(콘텐츠 축, 2026-07-20 아니키 픽 · T-260720-029): 상단은 '작업장 3개'(제품/작업일지/
  // 뉴스레터)만 노출하고, 나머지는 '더보기' 드롭다운으로 강등해 헤더를 슬림하게 유지한다.
  //   브랜드 = 강대종/파운더 홈(kangdaejong.com)
  //   1행 = 브랜드 + 주 메뉴(제품/작업일지/뉴스레터) + 더보기 드롭다운 + 문의 CTA
  //   더보기 = 작업장/인사이트/시스템/비용공개/lab/회사소개/대표소개
  // 2026-08-06 T-260806-060: 조직도를 더보기가 아니라 1행에 올린다(아니키 「헤더에서 바로」).
  // A안의 '작업장 3개' 축과는 다른 성격(회사 소개면)이지만, 직접 노출이 명시 요구다.
  const BRAND_HREF = 'https://kangdaejong.com/';
  const NAV_PRIMARY = [
    { key: 'products',   label: '제품',     href: 'https://work.kangdaejong.com/products/' },
    { key: 'worklog',    label: '작업일지', href: 'https://work.kangdaejong.com/worklog' },
    { key: 'newsletter', label: '뉴스레터', href: 'https://work.kangdaejong.com/newsletter' },
    { key: 'organization', label: '조직도', href: 'https://kangdaejong.com/organization/' },
  ];
  const NAV_MORE = [
    { key: 'workshop', label: '작업장',   href: 'https://work.kangdaejong.com/' },
    { key: 'insights', label: '인사이트', href: 'https://work.kangdaejong.com/insights' },
    { key: 'system',   label: '시스템',   href: 'https://work.kangdaejong.com/system' },
    { key: 'lab',      label: 'lab',      href: 'https://work.kangdaejong.com/lab' },
    { key: 'home',     label: '회사소개', href: 'https://kangdaejong.com/' },
    { key: 'founder',  label: '대표소개', href: 'https://founder.kangdaejong.com/' },
  ];

  // 공통 팔레트 (shadow DOM 안에서 자족 — 각 사이트 CSS 변수와 무관하게 동일하게 렌더)
  // 그록 톤 (T-260824-046) — 작업장 tokens.css 와 같은 검정 캔버스.
  // OS 라이트/다크를 가르지 않는다. 이름(PALETTE_DARK)은 호스트 미디어쿼리 배선용으로 남긴다.
  const PALETTE = `
    --mb-bg:#000000; --mb-elev:#0d0d0d; --mb-fg:#f2f2f2; --mb-dim:#b0b0b0; --mb-mute:#8a8a8a;
    --mb-border:rgba(255,255,255,0.08); --mb-soft:#141414; --mb-accent:#f2f2f2; --mb-accent-dim:#c8c8c8;
    --mb-cta-fg:#000000; --mb-shadow:transparent;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
  `;
  // 회사면(kangdaejong.com)만 tone="studio". 작업장 헤더는 기본 그록 검정 유지.
  const PALETTE_STUDIO = `
    --mb-bg:#10161f; --mb-elev:#182030; --mb-fg:#f3efe6; --mb-dim:#c5c0b5; --mb-mute:#8e8a82;
    --mb-border:rgba(212,165,116,0.22); --mb-soft:#1e2736; --mb-accent:#d4a574; --mb-accent-dim:#e0b98a;
    --mb-cta-fg:#10161f; --mb-shadow:transparent;
    --mb-mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    --mb-sans:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
  `;
  const PALETTE_DARK = PALETTE;
  const DARK_RULE = `@media (prefers-color-scheme: dark) { :host { ${PALETTE_DARK} } }`;
  const hostPalette = (el) => (el.getAttribute('tone') === 'studio' ? PALETTE_STUDIO : PALETTE);
  const hostDarkRule = (el) => (el.getAttribute('tone') === 'studio' ? '' : DARK_RULE);

  class MbHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const mk = (n) =>
        `<a href="${n.href}"${n.key === active ? ' class="active" aria-current="page"' : ''}>${n.label}</a>`;
      const primary = NAV_PRIMARY.map(mk).join('');
      const more = NAV_MORE.map(mk).join('');
      const moreActive = NAV_MORE.some((n) => n.key === active);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          /* 타이포 자족화: 호스트 페이지(회사소개/대표소개)의 line-height·letter-spacing
             상속 차이로 헤더가 사이트마다 다르게 보이던 것 차단 — 두 사이트 동일 렌더. */
          :host { ${hostPalette(this)} display:block; line-height:1.65; letter-spacing:normal; font-style:normal; }
          ${hostDarkRule(this)}
          .hdr { position:sticky; top:0; z-index:50; border-bottom:1px solid var(--mb-border); background:color-mix(in srgb, var(--mb-bg) 94%, transparent); backdrop-filter:blur(12px); font-family:var(--mb-sans); }
          .inner { width:min(calc(100% - 48px), 1120px); margin:0 auto; min-height:66px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:24px; }
          .brand { display:inline-flex; align-items:center; gap:10px; color:var(--mb-fg); font-size:15px; font-weight:700; text-decoration:none; white-space:nowrap; }
          .brand img { width:30px; height:30px; display:block; }
          .links { display:flex; align-items:center; justify-content:center; gap:22px; min-width:0; font-size:13px; white-space:nowrap; }
          .links a { color:var(--mb-dim); text-decoration:none; transition:color .15s; }
          .links a:hover, .links a.active { color:var(--mb-fg); }
          .links a.active { font-weight:700; }
          .actions { display:inline-flex; align-items:center; gap:12px; white-space:nowrap; }
          .more { position:relative; display:inline-flex; }
          .more-btn { display:inline-flex; align-items:center; gap:4px; min-height:34px; padding:0 6px; border:0; background:none; cursor:pointer; color:var(--mb-dim); font-family:inherit; font-size:13px; transition:color .15s; }
          .more-btn:hover, .more-btn.active, .more.open .more-btn { color:var(--mb-fg); }
          .more-btn.active { font-weight:700; }
          .more-btn .chev { font-size:10px; transition:transform .15s; }
          .more.open .more-btn .chev { transform:rotate(180deg); }
          .more-panel { position:absolute; right:0; top:calc(100% + 8px); z-index:60; display:none; flex-direction:column; min-width:168px; padding:8px; background:var(--mb-bg); border:1px solid var(--mb-border); border-radius:0; box-shadow:none; }
          .more.open .more-panel { display:flex; }
          .more-panel a { padding:9px 10px; border-radius:0; color:var(--mb-dim); text-decoration:none; font-size:13px; white-space:nowrap; transition:background .12s, color .12s; }
          .more-panel a:hover { background:var(--mb-soft); color:var(--mb-fg); }
          .more-panel a.active { color:var(--mb-fg); font-weight:700; background:var(--mb-soft); }
          .cta { display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 14px; border-radius:0; background:var(--mb-accent); color:var(--mb-cta-fg); font-size:14px; font-weight:700; text-decoration:none; white-space:nowrap; }
          .cta:hover { background:var(--mb-accent-dim); color:var(--mb-cta-fg); }
          @media (max-width:760px) {
            .inner { width:min(calc(100% - 32px), 1120px); grid-template-columns:1fr auto; min-height:auto; padding:14px 0 10px; gap:12px; }
            .brand span { display:none; }
            .links { grid-column:1 / -1; grid-row:2; justify-content:flex-start; gap:16px; overflow-x:auto; scrollbar-width:none; }
            .links::-webkit-scrollbar { display:none; }
            .actions { grid-column:2; grid-row:1; }
            .cta { min-height:34px; padding:0 12px; }
          }
        </style>
        <header class="hdr">
          <div class="inner">
            <a class="brand" href="${BRAND_HREF}" aria-label="마이너스베타스튜디오 홈"><img src="${BADGE}" alt="" width="30" height="30"/><span>마이너스베타스튜디오</span></a>
            <div class="links">${primary}</div>
            <div class="actions">
              <div class="more">
                <button class="more-btn${moreActive ? ' active' : ''}" type="button" aria-haspopup="true" aria-expanded="false">더보기<span class="chev">▾</span></button>
                <div class="more-panel" role="menu">${more}</div>
              </div>
              <a class="cta" href="mailto:minusbetastudio@gmail.com">문의</a>
            </div>
          </div>
        </header>`;
      const moreEl = root.querySelector('.more');
      const btn = root.querySelector('.more-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = moreEl.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      root.querySelector('.more-panel').addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => {
        if (!moreEl.classList.contains('open')) return;
        moreEl.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  class MbFooter extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host { ${hostPalette(this)} display:block; }
          ${hostDarkRule(this)}
          footer { width:min(calc(100% - 48px), 1120px); margin:0 auto; padding:34px 0 56px; border-top:1px solid var(--mb-border); font-family:var(--mb-sans); color:var(--mb-mute); font-size:12px; }
          .foot-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:16px; }
          .foot-head strong { color:var(--mb-fg); font-size:14px; }
          .foot-head a { color:var(--mb-fg); text-decoration:none; }
          .foot-head a:hover { text-decoration:underline; }
          .biz { display:flex; flex-wrap:wrap; gap:6px 14px; color:var(--mb-mute); }
          .copy { margin-top:16px; color:var(--mb-mute); }
          @media (max-width:640px) {
            footer { width:min(calc(100% - 32px), 1120px); padding-bottom:42px; }
            .foot-head { display:block; }
            .foot-head a { display:inline-block; margin-top:6px; }
            .biz { flex-direction:column; gap:4px; }
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
