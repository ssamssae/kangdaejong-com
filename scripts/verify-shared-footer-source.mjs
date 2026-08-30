import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const components = read("public/mb-components.js");
const companyPage = read("src/pages/index.astro");
const footerComponent = components.split("class MbFooter")[1] || "";

const checks = [
  {
    label: "company page renders the shared footer component",
    ok: /<mb-footer(?:\s[^>]*)?><\/mb-footer>/.test(companyPage),
  },
  {
    label: "shared component registers mb-footer for company and founder pages",
    ok:
      /class MbFooter extends HTMLElement/.test(components) &&
      /customElements\.define\('mb-footer', MbFooter\);/.test(components),
  },
  {
    label: "shared footer uses the work footer head layout",
    ok:
      /<div class="foot-head">\s*<strong>마이너스베타스튜디오<\/strong>\s*<a href="mailto:minusbetastudio@gmail\.com">minusbetastudio@gmail\.com<\/a>\s*<\/div>/.test(footerComponent) &&
      /\.foot-head \{ display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:16px; \}/.test(footerComponent),
  },
  {
    label: "shared footer keeps the work footer width, padding, and border rhythm",
    ok: /footer \{ width:min\(calc\(100% - 92px\), 1250px\); margin:0 auto; padding:34px 0 56px; border-top:1px solid var\(--mb-border\);/.test(footerComponent),
  },
  {
    label: "shared footer keeps business info as a wrapping inline row on desktop",
    ok: /\.biz \{ display:flex; flex-wrap:wrap; gap:6px 14px; color:var\(--mb-mute\); \}/.test(footerComponent),
  },
  {
    label: "shared footer stacks business info only on narrow screens",
    ok:
      /@media \(max-width:640px\)/.test(footerComponent) &&
      /\.biz \{ flex-direction:column; gap:4px; \}/.test(footerComponent),
  },
  {
    label: "legacy link-row footer stays removed",
    ok:
      !/<div class="links">/.test(footerComponent) &&
      !/GitHub<\/a>/.test(footerComponent) &&
      !/<a href="https:\/\/work\.kangdaejong\.com\/">작업장<\/a>/.test(footerComponent),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Shared footer source verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Shared footer source verification passed");
