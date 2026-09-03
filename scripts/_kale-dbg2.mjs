import { fetchFollow, BASE } from "./kale-lib.mjs";
const page = await fetchFollow("/");
const html = await page.text();
const form = html.match(/<form[^>]*action="\/b2b\/session"[\s\S]*?<\/form>/i)?.[0] ?? "";
console.log("=== session form TÜM inputlar (name | type | value(ilk40)) ===");
for (const m of form.matchAll(/<input[^>]*>/g)) {
  const tag = m[0];
  const name = (tag.match(/name="([^"]+)"/)||[])[1] || "(yok)";
  const type = (tag.match(/type="([^"]+)"/)||[])[1] || "text";
  const val = (tag.match(/value="([^"]*)"/)||[])[1] || "";
  console.log(`${name} | ${type} | ${val.slice(0,40)}`);
}
// commit / button
console.log("button/commit:", [...form.matchAll(/<button[^>]*>|name="commit"[^>]*value="([^"]*)"/g)].map(m=>m[0].slice(0,60)));
