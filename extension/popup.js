const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function row(label, value, dim) {
  if (!value) return "";
  return `<div class="row"><div class="label">${esc(label)}</div><div class="val${
    dim ? " dim" : ""
  }">${esc(value)}</div></div>`;
}

chrome.runtime.sendMessage({ type: "preview" }, (r) => {
  if (!r || !r.ok) {
    $("preview").innerHTML = `<div class="msg err">${esc(
      r?.error || "Tidak bisa membaca halaman ini.",
    )}</div>`;
    $("save").disabled = true;
    return;
  }
  const d = r.data;
  const catatan = (d.catatan || "").slice(0, 220);
  $("preview").innerHTML =
    row("Posisi", d.posisi || "—") +
    row("Perusahaan", d.perusahaan || "—") +
    row("Gaji harapan", d.gajiHarapan || "tidak tertera → 5-8 jt", true) +
    row("Sumber", d._sumber || d._host, true) +
    (catatan
      ? `<div class="row"><div class="label">Catatan</div><div class="note">${esc(
          catatan,
        )}${d.catatan.length > 220 ? "…" : ""}</div></div>`
      : "") +
    (d._found === "none"
      ? `<div class="msg warn">Halaman ini tidak punya data lowongan terstruktur — hasil mungkin kurang rapi, edit lagi di Zeus88.</div>`
      : "");
});

$("save").addEventListener("click", () => {
  $("save").disabled = true;
  $("save").textContent = "Menyimpan…";
  $("msg").className = "";
  $("msg").textContent = "";

  chrome.runtime.sendMessage({ type: "save" }, (r) => {
    $("save").disabled = false;
    $("save").textContent = "Simpan ke Zeus88";

    if (!r || !r.ok) {
      $("msg").className = "msg err";
      let html = esc(r?.error || "Gagal.");
      if (r?.needLogin)
        html += ` <a href="${esc(r.needLogin)}" target="_blank">Login</a>`;
      if (r?.openOptions) html += ` <a href="#" id="goopts">Buka pengaturan</a>`;
      $("msg").innerHTML = html;
      $("goopts")?.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
      return;
    }

    $("msg").className = "msg ok";
    $("msg").innerHTML =
      (r.duplicate ? "Sudah tersimpan sebelumnya. " : "Tersimpan ke Zeus88! ") +
      `<a href="${esc(r.url)}" target="_blank">Buka</a>`;
  });
});

$("opts").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
