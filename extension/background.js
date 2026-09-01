// Zeus88 — Simpan Lowongan (MV3 service worker)

async function getBase() {
  const { baseUrl } = await chrome.storage.sync.get("baseUrl");
  return (baseUrl || "").trim().replace(/\/+$/, "");
}

async function getSessionToken(base) {
  const cookie = await chrome.cookies.get({ url: base, name: "zeus88_session" });
  return cookie && cookie.value ? cookie.value : null;
}

// ── Ekstraksi data lowongan dari halaman ─────────────────────────────────────
// Di-inject ke tab aktif. Prioritas: JSON-LD JobPosting → microdata → OG/meta/DOM.
function extractJobFromPage() {
  const clean = (v) =>
    String(v == null ? "" : v)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

  const meta = (sel) =>
    document
      .querySelector(`meta[property="${sel}"],meta[name="${sel}"]`)
      ?.content?.trim() || "";

  const htmlToNode = (html) => {
    const d = document.createElement("div");
    d.innerHTML = String(html || "");
    return d;
  };

  // ── cari node JobPosting di semua <script type=ld+json> ──
  let job = null;
  for (const sc of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
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

  const orgName = (h) => {
    if (!h) return "";
    if (typeof h === "string") return clean(h);
    if (Array.isArray(h)) return orgName(h[0]);
    return clean(h.name || h.legalName || h["@name"] || "");
  };

  const titleOf = (t) => {
    if (!t) return "";
    if (typeof t === "object") return clean(t["@value"] || t.name || "");
    return clean(t);
  };

  const salaryOf = (bs) => {
    if (!bs) return "";
    const cur = clean(bs.currency || bs.salaryCurrency || "");
    const v = bs.value || bs;
    if (!v || typeof v !== "object") return "";
    const unit = String(v.unitText || "").toLowerCase();
    const unitId =
      { hour: "jam", day: "hari", week: "minggu", month: "bulan", year: "tahun" }[
        unit
      ] || (unit || "");
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

  const locationOf = (job) => {
    if (job.jobLocationType === "TELECOMMUTE") return "Remote";
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    const a = loc && loc.address;
    if (a && typeof a === "object")
      return clean(
        [a.addressLocality, a.addressRegion, a.addressCountry]
          .filter(Boolean)
          .join(", "),
      );
    if (typeof loc === "string") return clean(loc);
    if (job.applicantLocationRequirements)
      return orgName(job.applicantLocationRequirements) + " (remote)";
    return "";
  };

  // ── kualifikasi dari HTML deskripsi ──
  const KW =
    /(kualifikasi|persyaratan|requirements?|qualifications?|what (you.?ll need|we.?re looking for)|yang (kami cari|dibutuhkan|diharapkan)|kriteria|minimum qualifications|nice to have|preferred)/i;

  const qualificationsOf = (descHtml) => {
    if (!descHtml) return "";
    const root = htmlToNode(descHtml);

    // 1) cari heading/strong yang cocok KW, ambil isi setelahnya
    const cand = root.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,p,li,div");
    for (const el of cand) {
      const t = clean(el.textContent);
      if (!t || t.length > 90 || !KW.test(t)) continue;
      const parts = [];
      const isHeading = /^H[1-6]$/.test(el.tagName);
      let node = isHeading ? el.nextElementSibling : el.nextElementSibling;
      // kalau strong/b di dalam <p>/<li>, lanjut dari parent-nya
      if (!node && el.parentElement) node = el.parentElement.nextElementSibling;
      let steps = 0;
      while (node && steps < 20) {
        if (/^H[1-6]$/.test(node.tagName)) break;
        const nt = clean(node.textContent);
        if (nt) {
          if (node.tagName === "UL" || node.tagName === "OL") {
            for (const li of node.querySelectorAll("li")) {
              const x = clean(li.textContent);
              if (x) parts.push("• " + x);
            }
          } else {
            parts.push(nt);
          }
        }
        if (parts.join("\n").length > 1600) break;
        node = node.nextElementSibling;
        steps++;
      }
      if (parts.length) return (t + "\n" + parts.join("\n")).slice(0, 1800);
    }

    // 2) fallback: kalau deskripsi banyak bullet, ambil semua
    const lis = [...root.querySelectorAll("li")]
      .map((li) => clean(li.textContent))
      .filter((x) => x && x.length < 400);
    if (lis.length >= 3)
      return lis.map((x) => "• " + x).join("\n").slice(0, 1800);

    // 3) fallback terakhir: seluruh deskripsi
    return clean(root.textContent).slice(0, 1500);
  };

  // ── susun hasil ──
  const out = {
    linkLowongan: location.href,
    posisi: "",
    perusahaan: "",
    gajiHarapan: "",
    catatan: "",
    _found: "none",
  };

  if (job) {
    out._found = "json-ld";
    out.posisi = titleOf(job.title);
    out.perusahaan = orgName(job.hiringOrganization) || orgName(job.author);
    if (typeof job.url === "string" && /^https?:/.test(job.url))
      out.linkLowongan = job.url;
    out.gajiHarapan = salaryOf(job.baseSalary) || salaryOf(job.estimatedSalary);

    const head = [];
    const loc = locationOf(job);
    if (loc) head.push("Lokasi: " + loc);
    if (job.employmentType)
      head.push("Tipe: " + clean([].concat(job.employmentType).join(", ")));
    if (job.datePosted)
      head.push("Diposting: " + String(job.datePosted).slice(0, 10));

    const qual = qualificationsOf(job.description);
    out.catatan = [head.join("\n"), qual].filter(Boolean).join("\n\n").trim();
  }

  // ── fallback / lengkapi yang kosong dari DOM & meta ──
  if (!out.posisi) {
    let t = meta("og:title") || document.querySelector("h1")?.textContent || "";
    t = clean(t)
      .replace(/\s*[|\-–—]\s*(LinkedIn|Glassdoor|Indeed|Glints|Jobstreet|Kalibrr).*$/i, "")
      .replace(/\s+hiring\s+.*$/i, "");
    // pola LinkedIn: "Company hiring Title in Location"
    const m = clean(meta("og:title")).match(/hiring\s+(.+?)\s+in\s+/i);
    if (m) t = m[1];
    out.posisi = t || document.title;
  }
  if (!out.perusahaan) {
    const og = clean(meta("og:title"));
    const m =
      og.match(/^(.+?)\s+hiring\s+/i) ||
      og.match(/\bat\s+([A-Z][\w .&'-]{1,50})$/);
    out.perusahaan =
      (m && clean(m[1])) ||
      clean(meta("og:site_name")) ||
      clean(document.querySelector('[class*="company" i] a, [class*="employer" i]')?.textContent) ||
      location.hostname.replace(/^www\./, "");
  }
  if (!out.catatan) {
    const d = meta("og:description") || meta("description");
    if (d) out.catatan = clean(d).slice(0, 800);
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
  if (!base) {
    return { ok: false, error: "URL Zeus88 belum diatur.", openOptions: true };
  }
  const token = await getSessionToken(base);
  if (!token) {
    return {
      ok: false,
      error: "Belum login di Zeus88 pada browser ini.",
      needLogin: base + "/login",
    };
  }

  const data = await scrapeActiveTab();
  const payload = {
    perusahaan: data.perusahaan,
    posisi: data.posisi,
    linkLowongan: data.linkLowongan,
    catatan: data.catatan,
    gajiHarapan: data.gajiHarapan,
    sumberLowongan: data._sumber,
  };

  let res;
  try {
    res = await fetch(base + "/api/lamaran", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi Zeus88 (" + base + ")." };
  }

  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: out.error || `Gagal menyimpan (HTTP ${res.status}).`,
      needLogin: res.status === 401 ? base + "/login" : undefined,
    };
  }
  return { ok: true, ...out };
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
