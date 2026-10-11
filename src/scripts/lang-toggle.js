// T-261011-068 · 한국어/EN 즉시 전환.
// 마크업의 한국어가 정본이고, 영어는 src/data/i18n-en.json 에서 "한국어 문자열 → 영어" 로 찾는다.
// 새로고침 없이 본문·공용 헤더/푸터(shadow DOM)·aria-label 류 속성을 바꾸고, 선택은 localStorage 에 기억한다.
import dict from '../data/i18n-en.json';

const STORAGE_KEY = 'mb-lang';
const ATTRS = ['aria-label', 'alt', 'title', 'label', 'data-quote', 'data-scene'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
const originalHtml = new WeakMap();
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

function translateTextNode(node) {
  const parent = node.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.closest('[data-i18n-skip]')) return;
  let original = originalText.get(node);
  if (original === undefined) {
    original = node.nodeValue;
    originalText.set(node, original);
  }
  // 한국어로 돌아갈 때는 저장해 둔 원문을 쓰고, 영어 상태에서 새로 생긴 노드는 역사전으로 되돌린다.
  const next = current === 'ko' ? (toKorean(norm(original)) === undefined ? original : convert(original)) : convert(original);
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateElement(element) {
  if (SKIP.has(element.tagName) || element.closest('[data-i18n-skip]')) return;
  let saved = originalAttrs.get(element);
  for (const attr of ATTRS) {
    if (!element.hasAttribute(attr)) continue;
    if (!saved) {
      saved = {};
      originalAttrs.set(element, saved);
    }
    if (!(attr in saved)) saved[attr] = element.getAttribute(attr);
    const original = saved[attr];
    const next = current === 'ko' ? (toKorean(norm(original)) === undefined ? original : convert(original)) : convert(original);
    if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
  }
}

function walk(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  const texts = [];
  const elements = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) texts.push(node);
    else elements.push(node);
  }
  for (const element of elements) translateElement(element);
  for (const text of texts) translateTextNode(text);
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
      if (record.type === 'characterData') translateTextNode(record.target);
      else if (record.type === 'attributes') translateElement(record.target);
      else for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
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
