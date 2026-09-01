const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

chrome.runtime.sendMessage({ type: "preview" }, (r) => {
  if (!r || !r.ok) {
    $("preview").innerHTML = `<div class="msg err">${esc(
      r?.error || "Tidak bisa membaca halaman ini.",
    )}</div>`;
    $("save").disabled = true;
    return;
  }
  const d = r.data;
  $("preview").innerHTML = `
    <div class="row"><div class="label">Posisi</div><div class="val">${esc(
      d.posisi || "—",
    )}</div></div>
    <div class="row"><div class="label">Perusahaan</div><div class="val">${esc(
      d.perusahaan || "—",
    )}</div></div>
    <div class="row"><div class="label">Sumber</div><div class="val dim">${esc(
      d._sumber || d._host || "",
    )}</div></div>`;
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
