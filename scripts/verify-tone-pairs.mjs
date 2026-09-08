import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const tokens = read("src/styles/tokens.css");
const site = read("src/styles/site.css");
const header = read("public/mb-components.js");
const home = read("src/pages/index.astro");

const checks = [
  ["warm ledger tokens define shared canvas, paper, and copper", /--bg: #11100e;/.test(tokens) && /--fg: #f5efe2;/.test(tokens) && /--accent: #d5a06f;/.test(tokens)],
  ["display and body typography have separate roles", /--serif: "Noto Serif KR"/.test(tokens) && /--sans: "Pretendard Variable"/.test(tokens)],
  ["shared chrome matches the warm palette", /--mb-bg:#11100e/.test(header) && /--mb-fg:#f5efe2/.test(header) && /--mb-accent:#d5a06f/.test(header)],
  ["site stylesheet includes desktop and narrow mobile systems", /@media \(max-width: 980px\)/.test(site) && /@media \(max-width: 390px\)/.test(site)],
  ["old neon and Linear-indigo values stay removed", !/(#00e5ff|#00b8d4|#ff00aa|#7170FF|--cyan|--magenta)/i.test(`${tokens}\n${site}\n${header}\n${home}`)],
  ["homepage photographs remain real repository assets", /\/studio\/hero-desk\.jpg/.test(home) && /\/studio\/cheotireum\.jpg/.test(home)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Tone pair verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Tone pair verification passed");
