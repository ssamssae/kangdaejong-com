// T-261011-068 · 한국어/EN 즉시 전환.
// 마크업의 한국어가 정본이고, 영어는 src/data/i18n-en.json 에서 "한국어 문자열 → 영어" 로 찾는다.
// 새로고침 없이 본문·공용 헤더/푸터(shadow DOM)·aria-label 류 속성을 바꾸고, 선택은 localStorage 에 기억한다.
// T-261012-029: 사전을 인자로 받는 공용 함수로 분리했다 — 홈(i18n-en.json)·단백질(i18n-protein-en.json)이 각자 사전을 쓴다.
//   사전의 __title·__description·__intro_title_html 은 그 페이지 전용 키다(없으면 원문 유지).
export function startLangToggle(dict) {
  const STORAGE_KEY = 'mb-lang';
  const ATTRS = ['aria-label', 'alt', 'title', 'label', 'data-quote', 'data-scene', 'placeholder']; // placeholder: T-261012-029 (단백질 검색칸)
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  const originalHtml = new WeakMap();
  const appliedText = new WeakMap();
  const appliedAttrs = new WeakMap();
  // 영어 상태에서 페이지 스크립트가 새로 만든(바꾼) 텍스트·속성만 한국어 복귀 때 역사전을 쓴다. 처음부터 마크업에 있던
  // 영어(예: 단백질 카드의 'Glycine')는 사전 값과 같아도 그대로 둔다 (T-261012-029 — 종전엔 '글리신'으로 바뀌었다).
  const bornInEnglish = new WeakSet();
  const bornInEnglishAttrs = new WeakMap();
  const reverse = new Map(Object.entries(dict).filter(([key, value]) => !key.startsWith('__') && typeof value === 'string').map(([key, value]) => [value, key]));
  let current = 'ko';
  let applying = false;

  const norm = (text) => text.replace(/\s+/g, ' ').trim();
  const toEnglish = (text) => (Object.prototype.hasOwnProperty.call(dict, text) ? dict[text] : undefined);
  const toKorean = (text) => reverse.get(text);

  function roots() {
    const list = [document.body];
    for (const host of document.querySelectorAll('mb-header, mb-footer')) if (host.shadowRoot) list.push(host.shadowRoot);
    return list;
  }

  function convert(original) {
    const key = norm(original);
    if (!key) return original;
    const next = current === 'en' ? toEnglish(key) : toKorean(key);
    if (next === undefined) return current === 'en' ? original : original;
    const lead = original.match(/^\s*/)[0];
    const tail = original.match(/\s*$/)[0];
    return lead + next + tail;
  }

  function translateTextNode(node, created = false) {
    const parent = node.parentElement;
    if (!parent || SKIP.has(parent.tagName) || parent.closest('[data-i18n-skip]')) return;
    let original = originalText.get(node);
    const applied = appliedText.get(node);
    // 처음 보는 노드이거나, 마지막으로 이 스크립트가 쓴 값과 다르면 페이지가 바꾼 것이다 → 지금 값을 새 원문으로 (T-261012-029).
    if (original === undefined || (applied !== undefined && node.nodeValue !== applied)) {
      original = node.nodeValue;
      originalText.set(node, original);
      if (created && current === 'en') bornInEnglish.add(node);
      else bornInEnglish.delete(node);
    }
    // 한국어로 돌아갈 때는 저장해 둔 원문을 쓰고, 영어 상태에서 새로 생긴 노드는 역사전으로 되돌린다.
    const next = current === 'ko' ? (bornInEnglish.has(node) && toKorean(norm(original)) !== undefined ? convert(original) : original) : convert(original);
    if (node.nodeValue !== next) node.nodeValue = next;
    appliedText.set(node, next);
  }

  function translateElement(element, created = false) {
    if (SKIP.has(element.tagName) || element.closest('[data-i18n-skip]')) return;
    let saved = originalAttrs.get(element);
    for (const attr of ATTRS) {
      if (!element.hasAttribute(attr)) continue;
      if (!saved) {
        saved = {};
        originalAttrs.set(element, saved);
      }
      let applied = appliedAttrs.get(element);
      if (!applied) {
        applied = {};
        appliedAttrs.set(element, applied);
      }
      const value = element.getAttribute(attr);
      // 페이지 스크립트가 속성을 새로 바꿨으면(마지막으로 쓴 값과 다르면) 그 값을 새 원문으로 (T-261012-029, 3D 뷰어 aria-label).
      if (!(attr in saved) || (attr in applied && value !== applied[attr])) {
        saved[attr] = value;
        let born = bornInEnglishAttrs.get(element);
        if (!born) {
          born = new Set();
          bornInEnglishAttrs.set(element, born);
        }
        if (created && current === 'en') born.add(attr);
        else born.delete(attr);
      }
      const original = saved[attr];
      const bornEn = bornInEnglishAttrs.get(element)?.has(attr);
      const next = current === 'ko' ? (bornEn && toKorean(norm(original)) !== undefined ? convert(original) : original) : convert(original);
      if (value !== next) element.setAttribute(attr, next);
      applied[attr] = next;
    }
  }

  function walk(root, created = false) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    const texts = [];
    const elements = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) texts.push(node);
      else elements.push(node);
    }
    for (const element of elements) translateElement(element, created);
    for (const text of texts) translateTextNode(text, created);
  }

  function applyDocumentBlocks() {
    const title = document.getElementById('intro-title');
    if (title && typeof dict.__intro_title_html === 'string') {
      if (!originalHtml.has(title)) originalHtml.set(title, title.innerHTML);
      const html = current === 'ko' ? originalHtml.get(title) : dict.__intro_title_html;
      if (title.innerHTML !== html) title.innerHTML = html;
    }
    const meta = document.querySelector('meta[name="description"]');
    if (!originalHtml.has(document)) originalHtml.set(document, { title: document.title, description: meta ? meta.content : '' });
    const saved = originalHtml.get(document);
    document.title = current === 'ko' ? saved.title : (dict.__title || saved.title);
    if (meta) meta.content = current === 'ko' ? saved.description : (dict.__description || saved.description);
  }

  function setLang(lang, { persist = true } = {}) {
    current = lang === 'en' ? 'en' : 'ko';
    applying = true;
    try {
      document.documentElement.lang = current;
      applyDocumentBlocks();
      for (const root of roots()) walk(root);
      for (const host of document.querySelectorAll('mb-header')) host.setAttribute('lang', current);
    } finally {
      applying = false;
    }
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, current); } catch { /* 저장 불가 환경(시크릿 모드 등)은 무시 */ }
    }
  }

  const observer = new MutationObserver((records) => {
    if (applying || current === 'ko') return;
    applying = true;
    try {
      for (const record of records) {
        if (record.type === 'characterData') translateTextNode(record.target, true);
        else if (record.type === 'attributes') translateElement(record.target, true);
        else for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, true);
          else if (node.nodeType === Node.ELEMENT_NODE) walk(node, true);
        }
      }
    } finally {
      applying = false;
    }
  });

  async function init() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (window.customElements && !customElements.get('mb-header')) {
      await Promise.race([customElements.whenDefined('mb-header'), new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
    document.addEventListener('mb-lang-change', (event) => setLang(event.detail && event.detail.lang));
    for (const root of roots()) observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (saved === 'en') setLang('en', { persist: false });
    else for (const host of document.querySelectorAll('mb-header')) host.setAttribute('lang', 'ko');
  }

  init();
}
