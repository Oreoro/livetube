const $ = (s) => document.querySelector(s);
const toastEl = $("#toast");

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3000);
}

function token() {
  return sessionStorage.getItem("lt_admin_token") ?? "";
}

function headers() {
  return { "x-admin-token": token(), "Content-Type": "application/json" };
}

async function loadPanel() {
  $("#loginCard").hidden = true;
  $("#panelCard").hidden = false;
  await refreshList();
}

async function refreshList() {
  const r = await fetch("/api/channels", { headers: { "x-admin-token": token() } });
  if (r.status === 401) {
    sessionStorage.removeItem("lt_admin_token");
    $("#loginCard").hidden = false;
    $("#panelCard").hidden = true;
    return toast("Invalid token");
  }
  const data = await r.json();
  $("#storageMode").textContent = data.persistent ? "persistent (KV)" : "in-memory (set ADMIN_TOKEN + KV env vars for durability)";

  const list = $("#adminList");
  list.innerHTML = "";
  if (!data.channels.length) {
    list.innerHTML = `<p class="admin-hint">No community channels yet.</p>`;
    return;
  }
  for (const ch of data.channels) {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-main">
        <span class="admin-row-name">${esc(ch.name)}</span>
        <span class="admin-row-meta">@${esc(ch.handle)} · ${esc(ch.cat || "")} · ${esc(ch.group || "Community")}</span>
      </div>
      <button class="btn-danger" data-handle="${esc(ch.handle)}">Remove</button>`;
    row.querySelector(".btn-danger").addEventListener("click", async () => {
      const r2 = await fetch(`/api/channels?handle=${encodeURIComponent(ch.handle)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token() },
      });
      if (r2.ok) {
        toast(`Removed @${ch.handle}`);
        refreshList();
      } else {
        toast("Remove failed");
      }
    });
    list.appendChild(row);
  }
}

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  sessionStorage.setItem("lt_admin_token", $("#tokenInput").value);
  loadPanel();
});

$("#addForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    handle: $("#fHandle").value.trim(),
    name: $("#fName").value.trim(),
    cat: $("#fCat").value.trim(),
    group: $("#fGroup").value.trim() || "Community",
  };
  const r = await fetch("/api/channels", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (r.ok) {
    toast(`Added @${payload.handle}`);
    $("#addForm").reset();
    refreshList();
  } else {
    toast(data.error || "Add failed");
  }
});

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

if (token()) loadPanel();
