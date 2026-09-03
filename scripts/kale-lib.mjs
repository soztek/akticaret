// 2M Kale B2B — ortak kütüphane: login + kimlikli fetch (cookie jar + redirect takibi)
// Kimlik bilgileri env'den: KALE_B2B_CODE, KALE_B2B_PASSWORD. KODA GÖMÜLÜ DEĞİL.

export const BASE = "https://b2b.2mkaleyapi.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const jar = new Map();
function setCookies(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) {
      const k = pair.slice(0, i).trim();
      const v = pair.slice(i + 1).trim();
      if (v === "" || v === "-") jar.delete(k);
      else jar.set(k, v);
    }
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

// Yönlendirmeleri elle takip et, her adımda çerez topla.
export async function fetchFollow(path, opts = {}, maxHops = 6) {
  let url = path.startsWith("http") ? path : BASE + path;
  let method = opts.method ?? "GET";
  let body = opts.body;
  for (let hop = 0; hop < maxHops; hop++) {
    const res = await fetch(url, {
      method,
      headers: {
        "User-Agent": UA,
        Cookie: cookieHeader(),
        Accept: "text/html,application/xhtml+xml",
        ...(opts.headers ?? {}),
      },
      body,
      redirect: "manual",
    });
    setCookies(res);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      url = loc.startsWith("http") ? loc : BASE + loc;
      method = "GET";
      body = undefined;
      continue;
    }
    return res;
  }
  throw new Error("Çok fazla yönlendirme: " + path);
}

let loggedIn = false;

async function attemptLogin(code, pass) {
  jar.clear();
  // 1) Giriş sayfası (/, /b2b'ye yönlenir) → token + çerez
  const page = await fetchFollow("/");
  const html = await page.text();
  const sessionForm = html.match(/<form[^>]*action="\/b2b\/session"[\s\S]*?<\/form>/i)?.[0] ?? "";
  const token =
    sessionForm.match(/name="authenticity_token"[^>]*value="([^"]+)"/)?.[1] ??
    html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1];
  if (!token) return false;

  // 2) Giriş POST
  const body = new URLSearchParams();
  body.set("authenticity_token", token);
  body.set("b2b_user[username]", code);
  body.set("b2b_user[password]", pass);
  body.set("b2b_user[remember]", "1");

  const res = await fetchFollow("/b2b/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRF-Token": token,
      Origin: BASE,
      Referer: BASE + "/b2b",
    },
    body: body.toString(),
  });
  const after = await res.text();
  if (/İstek limitini aştınız/i.test(after)) return "ratelimit";
  // Başarı: kimlikli anasayfa (Cari Hesap) + login formu yok
  return /Cari Hesap/i.test(after) && !/b2b_user\[password\]/.test(after);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function login({ retries = 3, backoffMs = 20000 } = {}) {
  if (loggedIn) return;
  const code = process.env.KALE_B2B_CODE;
  const pass = process.env.KALE_B2B_PASSWORD;
  if (!code || !pass) throw new Error("KALE_B2B_CODE / KALE_B2B_PASSWORD env gerekli.");

  for (let attempt = 1; attempt <= retries; attempt++) {
    const r = await attemptLogin(code, pass).catch(() => false);
    if (r === true) {
      loggedIn = true;
      return;
    }
    if (r === "ratelimit") {
      if (attempt === retries) throw new Error("Rate limit — daha uzun beklemek gerekiyor.");
      console.log(`   ⏳ İstek limiti; ${backoffMs / 1000}sn bekleniyor (deneme ${attempt}/${retries})…`);
      await sleep(backoffMs);
    } else {
      if (attempt === retries) throw new Error("Giriş doğrulanamadı (kullanıcı adı/şifre/CSRF).");
      await sleep(3000);
    }
  }
}
