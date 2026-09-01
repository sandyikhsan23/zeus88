// Zeus88 — Simpan Lowongan (MV3 service worker)

async function getBase() {
  const { baseUrl } = await chrome.storage.sync.get("baseUrl");
  return (baseUrl || "").trim().replace(/\/+$/, "");
}

async function getSessionToken(base) {
  const cookie = await chrome.cookies.get({ url: base, name: "zeus88_session" });
  return cookie && cookie.value ? cookie.value : null;
}

// ── Ekstraksi data lowongan dari halaman (di-inject ke tab aktif) ────────────
// Urutan: JSON-LD JobPosting → embedded state (SEEK/Apollo/Next) → DOM/meta.
function extractJobFromPage() {
  const clean = (v) =>
    String(v == null ? "" : v)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&rsquo;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  const meta = (s) =>
    document.querySelector(`meta[property="${s}"],meta[name="${s}"]`)?.content?.trim() || "";
  const htmlNode = (html) => {
    const d = document.createElement("div");
    d.innerHTML = String(html || "");
    return d;
  };

  // ═══ kualifikasi dari HTML deskripsi ═══
  const KW =
    /(kualifikasi|persyaratan|requirements?|qualifications?|what (you.?ll need|we.?re looking for)|yang (kami cari|dibutuhkan|diharapkan)|kriteria|minimum qualifications?|nice to have|preferred qualifications?|skill)/i;
  const qualificationsOf = (descHtml) => {
    if (!descHtml) return "";
    const root = htmlNode(descHtml);
    const cand = root.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,p,li,div");
    for (const el of cand) {
      const t = clean(el.textContent);
      if (!t || t.length > 90 || !KW.test(t)) continue;
      const parts = [];
      let node = el.nextElementSibling || el.parentElement?.nextElementSibling;
      let steps = 0;
      while (node && steps < 25) {
        if (/^H[1-6]$/.test(node.tagName)) break;
        if (node.tagName === "UL" || node.tagName === "OL") {
          for (const li of node.querySelectorAll("li")) {
            const x = clean(li.textContent);
            if (x) parts.push("• " + x);
          }
        } else {
          const nt = clean(node.textContent);
          if (nt) parts.push(nt);
        }
        if (parts.join("\n").length > 1800) break;
        node = node.nextElementSibling;
        steps++;
      }
      if (parts.length) return (t + "\n" + parts.join("\n")).slice(0, 2000);
    }
    const lis = [...root.querySelectorAll("li")]
      .map((li) => clean(li.textContent))
      .filter((x) => x && x.length < 400);
    if (lis.length >= 3) return lis.map((x) => "• " + x).join("\n").slice(0, 2000);
    return clean(root.textContent).slice(0, 1800);
  };

  const salaryFromJsonLd = (bs) => {
    if (!bs) return "";
    const cur = clean(bs.currency || bs.salaryCurrency || "");
    const v = bs.value || bs;
    if (!v || typeof v !== "object") return "";
    const unit = String(v.unitText || "").toLowerCase();
    const unitId =
      { hour: "jam", day: "hari", week: "minggu", month: "bulan", year: "tahun" }[unit] || unit;
    const fmt = (n) => {
      const num = Number(String(n).replace(/[^\d.]/g, ""));
      return isFinite(num) && num > 0 ? num.toLocaleString("id-ID") : String(n);
    };
    let amt = "";
    if (v.minValue && v.maxValue) amt = `${fmt(v.minValue)} – ${fmt(v.maxValue)}`;
    else if (v.value) amt = fmt(v.value);
    else if (v.minValue) amt = `min ${fmt(v.minValue)}`;
    else if (v.maxValue) amt = `maks ${fmt(v.maxValue)}`;
    if (!amt) return "";
    return [cur, amt, unitId ? "/ " + unitId : ""].filter(Boolean).join(" ");
  };

  const out = {
    linkLowongan: location.href,
    posisi: "",
    perusahaan: "",
    gajiHarapan: "",
    catatan: "",
    _found: "none",
  };

  // ═══ 1. JSON-LD JobPosting ═══
  let job = null;
  for (const sc of document.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(sc.textContent);
    } catch {
      continue;
    }
    const stack = Array.isArray(data) ? [...data] : [data];
    while (stack.length) {
      const n = stack.shift();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n["@graph"])) stack.push(...n["@graph"]);
      const ty = n["@type"];
      if (ty === "JobPosting" || (Array.isArray(ty) && ty.includes("JobPosting"))) {
        job = n;
        break;
      }
    }
    if (job) break;
  }
  if (job) {
    out._found = "json-ld";
    const org = (h) =>
      !h ? "" : typeof h === "string" ? clean(h) : Array.isArray(h) ? org(h[0]) : clean(h.name || h.legalName);
    out.posisi = typeof job.title === "object" ? clean(job.title["@value"] || job.title.name) : clean(job.title);
    out.perusahaan = org(job.hiringOrganization) || org(job.author);
    if (typeof job.url === "string" && /^https?:/.test(job.url)) out.linkLowongan = job.url;
    out.gajiHarapan = salaryFromJsonLd(job.baseSalary) || salaryFromJsonLd(job.estimatedSalary);
    const head = [];
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    const a = loc && loc.address;
    if (job.jobLocationType === "TELECOMMUTE") head.push("Lokasi: Remote");
    else if (a && typeof a === "object")
      head.push("Lokasi: " + clean([a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ")));
    else if (typeof loc === "string") head.push("Lokasi: " + clean(loc));
    if (job.employmentType) head.push("Tipe: " + clean([].concat(job.employmentType).join(", ")));
    out.catatan = [head.join("\n"), qualificationsOf(job.description)].filter(Boolean).join("\n\n").trim();
  }

  // ═══ 2. Embedded state (SEEK/Jobstreet Apollo, __NEXT_DATA__, Nuxt, …) ═══
  if (out._found === "none" || !out.posisi || !out.perusahaan) {
    const states = [];
    for (const sc of document.querySelectorAll("script")) {
      const txt = sc.textContent || "";
      if ((sc.type === "application/json" || sc.id === "__NEXT_DATA__") && txt.length > 40) {
        try {
          states.push(JSON.parse(txt));
        } catch {}
        continue;
      }
      for (const marker of [
        "SEEK_APOLLO_DATA",
        "SEEK_REDUX_DATA",
        "__APOLLO_STATE__",
        "__NEXT_DATA__",
        "__NUXT__",
        "__INITIAL_STATE__",
      ]) {
        const mi = txt.indexOf(marker);
        if (mi < 0) continue;
        const eq = txt.indexOf("=", mi);
        const start = txt.indexOf("{", eq < 0 ? mi : eq);
        if (start < 0) continue;
        let depth = 0,
          end = -1;
        for (let j = start; j < txt.length; j++) {
          const c = txt[j];
          if (c === '"') {
            j++;
            while (j < txt.length && txt[j] !== '"') {
              if (txt[j] === "\\") j++;
              j++;
            }
          } else if (c === "{") depth++;
          else if (c === "}") {
            depth--;
            if (depth === 0) {
              end = j + 1;
              break;
            }
          }
        }
        if (end > start) {
          try {
            states.push(JSON.parse(txt.slice(start, end)));
          } catch {}
        }
      }
    }

    const getK = (o, re) => {
      for (const k of Object.keys(o)) if (re.test(k)) return o[k];
      return undefined;
    };
    const findJob = (rootState) => {
      const seen = new Set();
      const resolve = (v) =>
        v && typeof v === "object" && typeof v.__ref === "string" && rootState[v.__ref]
          ? rootState[v.__ref]
          : v;
      const stack = [rootState];
      while (stack.length) {
        let o = resolve(stack.pop());
        if (!o || typeof o !== "object" || seen.has(o)) continue;
        seen.add(o);
        const keys = Object.keys(o);
        const hasTitle = keys.some((k) => /^(title|jobTitle|roleTitle)(\(|$)/i.test(k));
        const hasCo = keys.some((k) => /^(advertiser|company|hiringOrganization|employer)(\(|$)|advertiserName|companyName/i.test(k));
        const hasDesc = keys.some((k) => /^(content|description|jobDescription|abstract)/i.test(k));
        if (hasTitle && (hasCo || hasDesc)) return { job: o, root: rootState, resolve };
        for (const k of keys) {
          const v = o[k];
          if (v && typeof v === "object") stack.push(v);
        }
      }
      return null;
    };
    const label = (v, resolve) => {
      v = resolve ? resolve(v) : v;
      if (v == null) return "";
      if (typeof v === "string") return clean(v);
      if (typeof v === "object") {
        const l = getK(v, /^(label|name|text)(\(|$)/i);
        if (l != null) return label(l, resolve);
      }
      return "";
    };

    for (const st of states) {
      if (!st || typeof st !== "object") continue;
      const found = findJob(st);
      if (!found) continue;
      const { job: j, resolve } = found;
      out._found = out._found === "none" ? "embedded" : out._found;

      const title = getK(j, /^(title|jobTitle|roleTitle)(\(|$)/i);
      if (!out.posisi && title != null) out.posisi = clean(typeof title === "object" ? label(title, resolve) : title);

      const co =
        getK(j, /^(advertiser|company|hiringOrganization|employer)(\(|$)/i) ??
        getK(j, /advertiserName|companyName|employerName/i);
      if (!out.perusahaan && co != null) out.perusahaan = label(co, resolve);

      if (!out.gajiHarapan) {
        const sal = getK(j, /^(salary|salaryLabel|salaryText|payRange)(\(|$)/i);
        if (sal != null) out.gajiHarapan = label(sal, resolve).replace(/\bper month\b/i, "/ bulan").replace(/\bper year\b/i, "/ tahun");
      }

      // deskripsi = string HTML terpanjang di antara key content*/description*
      let descHtml = "";
      for (const k of Object.keys(j)) {
        if (!/^(content|description|jobDescription)/i.test(k)) continue;
        const v = resolve(j[k]);
        if (typeof v === "string" && v.length > descHtml.length) descHtml = v;
      }
      const head = [];
      const loc = getK(j, /^(location|jobLocation|locationInfo)(\(|$)/i);
      const locStr = label(loc, resolve);
      if (locStr) head.push("Lokasi: " + locStr);
      const wt = getK(j, /^(workTypes?|employmentType|workType)(\(|$)/i);
      const wtStr = label(wt, resolve);
      if (wtStr) head.push("Tipe: " + wtStr);

      const qual = descHtml ? qualificationsOf(descHtml) : "";
      const built = [head.join("\n"), qual].filter(Boolean).join("\n\n").trim();
      if (built && built.length > out.catatan.length) out.catatan = built;
      break;
    }
  }

  // ═══ 3. DOM / meta fallback ═══
  if (!out.posisi) {
    let t = clean(meta("og:title") || document.querySelector("h1")?.textContent || document.title);
    t = t.replace(/\s*[|\-–—]\s*(LinkedIn|Glassdoor|Indeed|Glints|Jobstreet.*|Kalibrr|SEEK).*$/i, "");
    const m = clean(meta("og:title")).match(/hiring\s+(.+?)\s+in\s+/i);
    if (m) t = m[1];
    out.posisi = t;
  }
  if (!out.perusahaan) {
    const og = clean(meta("og:title"));
    const m = og.match(/^(.+?)\s+hiring\s+/i);
    out.perusahaan =
      (m && clean(m[1])) ||
      clean(document.querySelector('[class*="company" i] a,[class*="advertiser" i],[data-automation*="company" i]')?.textContent) ||
      clean(meta("og:site_name")).replace(/\s*(Indonesia|ID)$/i, "") ||
      location.hostname.replace(/^www\./, "");
  }
  if (!out.catatan) {
    const d = meta("og:description") || meta("description");
    if (d) out.catatan = clean(d).slice(0, 900);
  }

  return out;
}

const SOURCES = {
  "linkedin.com": "LinkedIn",
  "glints.com": "Glints",
  "jobstreet.co.id": "Jobstreet",
  "jobstreet.com": "Jobstreet",
  "kalibrr.com": "Kalibrr",
  "kalibrr.id": "Kalibrr",
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
  "glassdoor.co.id": "Glassdoor",
  "kitalulus.com": "KitaLulus",
  "karir.com": "Karir.com",
  "topkarir.com": "TopKarir",
  "jobs.id": "Jobs.id",
  "dealls.com": "Dealls",
  "techinasia.com": "Tech in Asia",
};
function sourceFor(host) {
  const h = (host || "").replace(/^www\./, "");
  for (const [dom, name] of Object.entries(SOURCES)) {
    if (h === dom || h.endsWith("." + dom)) return name;
  }
  return h;
}

async function scrapeActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error("Tidak ada tab aktif.");
  if (/^(chrome|edge|about|chrome-extension):/.test(tab.url || "")) {
    throw new Error("Buka halaman lowongan dulu.");
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractJobFromPage,
  });
  let host = "";
  try {
    host = new URL(tab.url).hostname;
  } catch {}
  return { ...result, _host: host, _sumber: sourceFor(host) };
}

async function saveJob() {
  const base = await getBase();
  if (!base) return { ok: false, error: "URL Zeus88 belum diatur.", openOptions: true };
  const token = await getSessionToken(base);
  if (!token)
    return { ok: false, error: "Belum login di Zeus88 pada browser ini.", needLogin: base + "/login" };

  const data = await scrapeActiveTab();
  const payload = {
    perusahaan: data.perusahaan,
    posisi: data.posisi,
    linkLowongan: data.linkLowongan,
    catatan: data.catatan,
    // gaji tidak tertera di web → pakai default ekspektasi
    gajiHarapan: data.gajiHarapan || "5-8 jt",
    sumberLowongan: data._sumber,
  };

  let res;
  try {
    res = await fetch(base + "/api/lamaran", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi Zeus88 (" + base + ")." };
  }
  const outp = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: outp.error || `Gagal menyimpan (HTTP ${res.status}).`,
      needLogin: res.status === 401 ? base + "/login" : undefined,
    };
  }
  return { ok: true, ...outp };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "preview") {
    scrapeActiveTab()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg && msg.type === "save") {
    saveJob()
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
});
