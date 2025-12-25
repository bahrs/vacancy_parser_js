let _lastVacancy = null;

function todayLocalISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function detectSource(hostname) {
  const host = hostname.replace(/^www\./, "").toLowerCase();

  if (host.endsWith("hh.ru")) return "hh.ru";
  if (host === "career.habr.com" || host === "career.habr.ru") return "career.habr";
  if (host.endsWith("geekjob.ru")) return "geekjob";
  if (host.endsWith("superjob.ru")) return "superjob";
  return "other";
}

function parseBySource(source) {
  if (source === "hh.ru" && typeof parseHH === "function") return parseHH();
  if (source === "career.habr" && typeof parseHabr === "function") return parseHabr();
  if (source === "geekjob" && typeof parseGeekjob === "function") return parseGeekjob();
  if (source === "superjob" && typeof parseSuperjob === "function") return parseSuperjob();
  return parseGeneric();
}

function parseGeneric() {
  const title = pickText(["h1", "title"]) || "";
  const company =
    getMetaContent("og:site_name") ||
    getMetaContent("og:title") ||
    pickText(["[itemprop='hiringOrganization']"]) ||
    "";

  const raw = document.body?.innerText || "";
  const description = pickText(["article", "main"]) || raw;

  return {
    role: title,
    company,
    salary: "",
    location_city: "",
    location_metro: "",
    work_mode: inferWorkMode(raw),
    skills: [],
    job_description_raw: description,
    source: "other"
  };
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  (async () => {
    try {
      if (req?.action === "__ping") {
        sendResponse({ ok: true });
        return;
      }

      if (req?.action === "getLastVacancy") {
        sendResponse({ ok: true, data: _lastVacancy || {} });
        return;
      }

      if (req?.action !== "parseVacancy") {
        sendResponse({ ok: false, error: "Unknown action" });
        return;
      }

      const source = detectSource(location.hostname);
      const partial = parseBySource(source);

      const canonical =
        document.querySelector("link[rel='canonical']")?.getAttribute("href") ||
        location.href;

      const job_link = stripTrackingParams(canonical);

      const role = (partial.role || "").trim();
      const role_norm = normalizeRole(role);

      const rawText = (partial.job_description_raw || document.body?.innerText || "").trim();

      // Include experience field if available for level inference
      const experienceText = (partial.experience || "").trim();
      const textForLevel = experienceText ? `${rawText}\n${experienceText}` : rawText;

      // Pass levelLink from Habr parser for explicit level detection (extra args are OK in JS)
      const level = partial.level || inferLevel(role, textForLevel, partial.levelLink || "");

      // Normalize work_mode if extracted, otherwise infer from rawText
      const work_mode = partial.work_mode
        ? inferWorkMode(partial.work_mode)
        : inferWorkMode(rawText);

      const { salary_min_net, salary_currency } = parseSalaryMinNetAndCurrency(partial.salary || "");

      // --- NEW LOGIC: Stack always from raw text, Skills from DOM or fallback to stack ---

      // 1) STACK: Always extract from raw text using tech_stack
      let stack = [];
      let allTechSkills = [];

      if (typeof window.extractTechSkillsFromText === "function") {
        allTechSkills = window.extractTechSkillsFromText(rawText);
        
        // Pick top skills for stack (prioritized)
        if (typeof window.pickTechStack === "function") {
          stack = window.pickTechStack(allTechSkills, 6);
        } else {
          stack = allTechSkills.slice(0, 6);
        }
      }

      // 2) SKILLS: Prefer DOM skills, fallback to stack if empty
      const domSkills = dedupeArray(
        (partial.skills || [])
          .map((x) => cleanText(x))
          .filter(Boolean)
      );

      const skills = domSkills.length > 0 ? domSkills : stack;

      // Handle both location_address and location_city for backward compatibility
      const location_address = cleanText(partial.location_address || partial.location_city || "");
      const location_metro = cleanText(partial.location_metro || "");

      const data = {
        // template fields
        company: cleanText(partial.company || ""),
        role,
        role_norm,
        level,
        source: source === "career.habr" ? "career.habr.com" : source,
        job_link,
        work_mode,
        location_address,
        location_metro,
        commute_minutes: "",
        salary: cleanText(partial.salary || ""),
        salary_min_net,
        salary_currency,
      
        stack,
        skills,
      
        apply_date: todayLocalISO(), // local YYYY-MM-DD
        publish_date: cleanText(partial.publish_date || ""), // from parser
        tags: partial.tags || [],
        job_description_raw: rawText,
        cover_letter_draft: "",
      
        // optional extras
        parsed_at: new Date().toISOString()
      };

      data.filename = generateFilename(data);
      _lastVacancy = data;

      sendResponse({ ok: true, data });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();

  return true; // keep channel open for async
});