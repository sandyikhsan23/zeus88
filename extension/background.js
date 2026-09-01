// Zeus88 — Simpan Lowongan (MV3 service worker)

async function getBase() {
  const { baseUrl } = await chrome.storage.sync.get("baseUrl");
  return (baseUrl || "").trim().replace(/\/+$/, "");
}

async function getSessionToken(base) {
  const cookie = await chrome.cookies.get({ url: base, name: "zeus88_session" });
  return cookie && cookie.value ? cookie.value : null;
}

// ── Ekstraksi data lowongan dari halaman ────────────────────────────
// Di-inject ke tab aktif. Prioritas: JSON-LD JobPosting → fallback OG/meta.
function extractJobFromPage() {
  const strip = (v) => {
    if (v == null) return undefined;
    let t = String(
      typeof v === "object" ? v.name || v["@value"] || v.legalName || "" : v,
    );
    t = t
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return t || undefined;
  };
  const meta = (sel) =>
    document
      .querySelector(`meta[property="${sel}"],meta[name="${sel}"]`)
      ?.content?.trim() || undefined;

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
    const list = Array.isArray(data) ? data : data["@graph"] || [data];
    for (const n of list) {
      const ty = n && n["@type"];
      if (ty === "JobPosting" || (Array.isArray(ty) && ty.includes("JobPosting"))) {
        job = n;
        break;
      }
    }
    if (job) break;
  }

  const out = { linkLowongan: location.href };

  if (job) {
    out.posisi = strip(job.title);
    out.perusahaan = strip(job.hiringOrganization);
    if (typeof job.url === "string") out.linkLowongan = job.url;

    const bits = [];
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    const addr = loc && loc.address;
    if (addr && typeof addr === "object") {
      const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .map(strip)
        .filter(Boolean);
      if (parts.length) bits.push("Lokasi: " + parts.join(", "));
    } else if (job.jobLocationType === "TELECOMMUTE") {
      bits.push("Lokasi: Remote");
    }
    if (job.employmentType)
      bits.push("Tipe: " + strip([].concat(job.employmentType).join(", ")));

    const bs = job.baseSalary;
    const val = bs && (bs.value || bs);
    if (val && (val.minValue || val.maxValue || val.value)) {
      const amount =
        val.minValue && val.maxValue
          ? `${val.minValue}–${val.maxValue}`
          : val.value || val.minValue || val.maxValue;
      bits.push(
        `Gaji (dari lowongan): ${amount} ${bs.currency || ""} ${
          val.unitText ? "/ " + String(val.unitText).toLowerCase() : ""
        }`.replace(/\s+/g, " ").trim(),
      );
    }
    if (job.datePosted) bits.push("Diposting: " + String(job.datePosted).slice(0, 10));
    if (job.validThrough)
      bits.push("Berlaku s/d: " + String(job.validThrough).slice(0, 10));

    const desc = strip(job.description);
    if (desc) bits.push("\n" + desc.slice(0, 800));

    out.catatan = bits.join("\n").trim() || undefined;
  } else {
    out.posisi =
      meta("og:title") ||
      document.querySelector("h1")?.textContent?.trim() ||
      document.title;
    out.perusahaan = meta("og:site_name");
    const d = meta("og:description") || meta("description");
    if (d) out.catatan = d.slice(0, 800);
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
  } catch (e) {
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
