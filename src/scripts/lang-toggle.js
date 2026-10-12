// T-261011-068 · 홈 한국어/EN 즉시 전환. 공용 로직은 lang-toggle-core.js (T-261012-029 분리).
import dict from '../data/i18n-en.json';
import { startLangToggle } from './lang-toggle-core.js';

startLangToggle(dict);
