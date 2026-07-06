import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");

const expected = [
  {
    label: "founder primary nav is raised to 15px",
    pattern: /:host\(\[active="founder"\]\) \.links\s*\{[^}]*font-size:15px;/,
  },
  {
    label: "founder secondary nav is raised to 13px",
    pattern: /:host\(\[active="founder"\]\) \.sub\s*\{[^}]*font-size:13px;/,
  },
  {
    label: "founder CTA keeps pace with primary nav",
    pattern: /:host\(\[active="founder"\]\) \.cta\s*\{[^}]*font-size:15px;/,
  },
];

const failures = expected.filter((check) => !check.pattern.test(source));

if (failures.length > 0) {
  console.error("Founder header size verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Founder header size verification passed");
