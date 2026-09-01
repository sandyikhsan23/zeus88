const input = document.getElementById("url");
const ok = document.getElementById("ok");

chrome.storage.sync.get("baseUrl", ({ baseUrl }) => {
  if (baseUrl) input.value = baseUrl;
});

document.getElementById("save").addEventListener("click", () => {
  let v = input.value.trim().replace(/\/+$/, "");
  if (v && !/^https?:\/\//.test(v)) v = "https://" + v;
  chrome.storage.sync.set({ baseUrl: v }, () => {
    input.value = v;
    ok.textContent = "Tersimpan ✓";
    setTimeout(() => (ok.textContent = ""), 2000);
  });
});
