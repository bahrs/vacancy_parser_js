let currentMarkdown = "";
let templateText = "";

const parseBtn = document.getElementById("parseBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");

function showStatus(message, type = "info") {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
  statusEl.style.display = "block";
}

function showPreview(md) {
  previewEl.textContent = md;
  previewEl.style.display = "block";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Fix for: "Could not establish connection. Receiving end does not exist."
 * We:
 * 1) try ping
 * 2) if fails, inject scripts into the page (no refresh needed)
 */
async function ensureContentScript(tabId) {
  try {
    const pong = await chrome.tabs.sendMessage(tabId, { action: "__ping" });
    if (pong && pong.ok) return true;
  } catch (_) {
    // ignore -> will inject
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [
      "lib/normalize.js",
      "parsers/hh.js",
      "parsers/habr.js",
      "parsers/geekjob.js",
      "parsers/superjob.js",
      "content_loader.js"
    ]
  });

  // verify again
  const pong2 = await chrome.tabs.sendMessage(tabId, { action: "__ping" });
  return !!(pong2 && pong2.ok);
}

function buildFilename(v) {
  // Uses Windows-safe naming convention:
  // "{company} {role_abbrev} -{levelAbbrev}.md" (level is optional)
  return generateFilename(v);
}


async function loadTemplateOnce() {
  if (templateText) return templateText;
  templateText = await loadExtensionTextFile("templates/obsidian_vacancy.md");
  return templateText;
}

parseBtn.addEventListener("click", async () => {
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  previewEl.style.display = "none";
  currentMarkdown = "";

  try {
    showStatus("Parsing page…", "info");

    const tab = await getActiveTab();
    if (!tab || !tab.id) throw new Error("No active tab");

    const ok = await ensureContentScript(tab.id);
    if (!ok) throw new Error("Content script injection failed");

    const resp = await chrome.tabs.sendMessage(tab.id, {
      action: "parseVacancy"
    });

    if (!resp || !resp.ok) {
      throw new Error(resp?.error || "Unknown parse error");
    }

    const vacancy = resp.data || {};
    await loadTemplateOnce();

    currentMarkdown = renderTemplate(templateText, vacancy);

    showStatus(
      `✅ Parsed: ${vacancy.source || "unknown"}\n` +
        `Company: ${vacancy.company || "-"}\n` +
        `Role: ${vacancy.role || "-"}`,
      "success"
    );

    showPreview(currentMarkdown);
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
  } catch (e) {
    showStatus(`❌ ${e.message || e}`, "error");
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    if (!currentMarkdown) return;
    await navigator.clipboard.writeText(currentMarkdown);
    showStatus("✅ Copied to clipboard", "success");
  } catch (e) {
    showStatus(`❌ Copy failed: ${e.message || e}`, "error");
  }
});

downloadBtn.addEventListener("click", async () => {
  try {
    if (!currentMarkdown) return;

    const tab = await getActiveTab();
    const resp = await chrome.tabs.sendMessage(tab.id, { action: "getLastVacancy" });
    const vacancy = resp?.data || {};

    const filename = buildFilename(vacancy);

    const blob = new Blob([currentMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showStatus(`✅ Downloaded: ${filename}`, "success");
  } catch (e) {
    showStatus(`❌ Download failed: ${e.message || e}`, "error");
  }
});
