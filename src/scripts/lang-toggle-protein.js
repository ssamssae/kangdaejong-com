// T-261012-029 · 단백질 도감 한국어/EN 즉시 전환 — 홈과 같은 공용 로직, 사전만 단백질 전용.
import dict from '../data/i18n-protein-en.json';
import { startLangToggle } from './lang-toggle-core.js';

startLangToggle(dict);
