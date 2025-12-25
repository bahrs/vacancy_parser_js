function cleanText(s) {
    return (s || "")
      .toString()
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  
  function dedupeArray(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr || []) {
      const key = (x || "").toString().trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push((x || "").toString().trim());
    }
    return out;
  }
  
  function pickText(selectors, root = document) {
    for (const sel of selectors || []) {
      try {
        const el = root.querySelector(sel);
        const t = cleanText(el?.innerText || el?.textContent || "");
        if (t) return t;
      } catch (_) {}
    }
    return "";
  }
  
  function pickAttr(selectors, attr, root = document) {
    for (const sel of selectors || []) {
      try {
        const el = root.querySelector(sel);
        const v = el?.getAttribute?.(attr) || "";
        const t = cleanText(v);
        if (t) return t;
      } catch (_) {}
    }
    return "";
  }
  
  function pickAllText(selectors, root = document) {
    const items = [];
    for (const sel of selectors || []) {
      try {
        root.querySelectorAll(sel).forEach((el) => {
          const t = cleanText(el?.innerText || el?.textContent || "");
          if (t) items.push(t);
        });
      } catch (_) {}
    }
    return items;
  }
  
  function getMetaContent(propertyOrName) {
    const el =
      document.querySelector(`meta[property="${propertyOrName}"]`) ||
      document.querySelector(`meta[name="${propertyOrName}"]`);
    return cleanText(el?.getAttribute("content") || "");
  }
  
  function htmlToText(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return cleanText(div.innerText || div.textContent || "");
  }
  
  function stripTrackingParams(urlLike) {
    try {
      const u = new URL(urlLike);
      u.hash = "";
  
      const badKeys = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "yclid",
        "gclid",
        "fbclid",
        "from",
        "source",
        "ref",
        "referer",
        "tracking",
        "track",
        "roistat",
        "roistat_referrer",
        "roistat_pos",
        "roistat_visit",
        "rs",
        "rsid",
        "erid"
      ];
  
      for (const k of [...u.searchParams.keys()]) {
        const lk = k.toLowerCase();
        if (badKeys.includes(lk) || lk.startsWith("utm_")) {
          u.searchParams.delete(k);
        }
      }
  
      // keep things clean if empty
      const s = u.toString();
      return s.endsWith("?") ? s.slice(0, -1) : s;
    } catch (_) {
      // fallback: just cut at #
      return (urlLike || "").toString().split("#")[0];
    }
  }
  
  function slugify(s) {
    return (s || "")
      .toString()
      .toLowerCase()
      .replace(/[\u0400-\u04FF]/g, (ch) => ch) // keep Cyrillic (Obsidian is ok)
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  
  function normalizeRole(role) {
    const t = (role || "").toLowerCase();

    const rules = [
        // Data Analyst: add "обработка данных" / "специалист по обработке данных"
        {
          key: "Data Analyst",
          re: /(data\s*analyst|аналитик\s*данных|дата(\s*|-)аналитик|обработк\w*\s*данных|специалист\s*по\s*обработк\w*\s*данных)/i
        },
        { key: "Product Analyst", re: /(product\s*analyst|продуктов(ый|ая)\s*аналитик)/i },
        { key: "BI Analyst", re: /(bi(\s*|-)analyst|аналитик\s*bi|power\s*bi|business\s*intelligence)/i },
      
        // Fix DS rule: DON'T classify everything with "ml" as Data Scientist
        { key: "Data Scientist", re: /(data(\s*|-)scientist|data\s*science|дата\s*сайентист)/i },
      
        { key: "ML Engineer", re: /(ml\s*engineer|machine\s*learning\s*engineer|mle\b)/i },
        { key: "Data Engineer", re: /(data\s*engineer|инженер\s*данных|dwh\s*engineer?|airflow)/i }
      ];
      
  
    for (const r of rules) {
      if (r.re.test(t)) return r.key;
    }
    return cleanText(role);
  }
  
  function inferLevel(role, text, levelLink = "") {
    // First check the levelLink parameter (from Habr's explicit level)
    const linkText = (levelLink || "").toLowerCase();
    if (/junior|младш/i.test(linkText)) return "junior";
    if (/middle|средн/i.test(linkText)) return "middle";
    if (/senior|старш/i.test(linkText)) return "senior";
    if (/intern|стаж/i.test(linkText)) return "intern";
  
    // Then check role and description text as before
    const t = `${role || ""}\n${text || ""}`.toLowerCase();
  
    if (/\b(intern|internship|стаж(е|ё)р|стажировка)\b/i.test(t)) return "intern";
    if (/\b(junior|джун|младш(ий|ая))\b/i.test(t)) return "junior";
    if (/\bот\s*1\s*(год|года|лет)\b/i.test(t)) return "junior";
    if (/\bjunior\s*\+\s*(?:\\|\/)?\s*(?:middle|mid)?/i.test(t)) return "junior+";
    if (/\b(middle|mid|мидл|средн(ий|яя))\b/i.test(t)) return "middle";
    if (/\b(senior|lead|principal|старш(ий|ая)|ведущ(ий|ая))\b/i.test(t)) return "senior";
  
    if (/\b(1\s*[–-]\s*3|1\s*-\s*3|от\s*1\s*(?:до|-)\s*3|от\s*2[-\s]х?\s*(?:и\s*)?более)\s*(год|лет|года)\b/i.test(t)) return "junior+";
    if (/\b(3\s*[–-]\s*5|3\s*-\s*5|от\s*3\s*(?:до|-)\s*5|от\s*3[-\s]х?\s*(?:и\s*)?более)\s*(год|лет|года)\b/i.test(t)) return "middle";
    if (/\b(5\s*\+|от\s*5\s*и?\s*более|более\s*5)\s*(год|лет|года)/i.test(t)) return "senior";
  
    return "";
  }
  
  function inferWorkMode(text) {
    const t = (text || "").toLowerCase();
  
    // "Можно удалённо" means hybrid (office + remote option) - CHECK THIS FIRST
    if (/(можно\s*удал(е|ё)нн?о)/i.test(t)) return "hybrid";
    
    // Full remote patterns
    if (/(удал(е|ё)нн?о|remote|fully remote|100% remote)/i.test(t)) return "remote";
    
    // Explicit hybrid
    if (/(гибрид|hybrid)/i.test(t)) return "hybrid";
    
    // Office-only
    if (/(офис|office|на месте|onsite|очный|очно|в офисе|работник находится в офисе)/i.test(t)) return "office";
  
    return "";
  }
  
  function parseSalaryMinNetAndCurrency(salaryText) {
    const s = (salaryText || "").toLowerCase();
  
    // currency detection
    let currency = "RUB"; // default
    if (/[₽]|руб/.test(s)) currency = "RUB";
    else if (/[€]|eur/.test(s)) currency = "EUR";
    else if (/\$|usd/.test(s)) currency = "USD";
  
    // extract numbers
    const nums = (salaryText || "").match(/\d[\d\s\u00A0]*\d|\d/g) || [];
    const values = nums
      .map((x) => parseInt(x.replace(/[^\d]/g, ""), 10))
      .filter((n) => Number.isFinite(n));
  
    if (!values.length) {
      return { salary_min_net: "", salary_currency: "RUB" };
    }
  
    const min = Math.min(...values);
  
    // convert to roubles
    let amountInRub = min;
    if (currency === "USD") {
      amountInRub = min * 85;
    } else if (currency === "EUR") {
      amountInRub = min * 100;
    }
    // RUB stays as is
  
    // net/gross conversion
    const isGross =
      /(до\s*вычета|gross|до\s*налогов|before\s*tax)/i.test(salaryText || "");
    const isNet =
      /(на\s*руки|net|после\s*вычета|after\s*tax)/i.test(salaryText || "");
  
    // if gross and not explicitly net, convert to net
    let netAmount = amountInRub;
    if (isGross && !isNet) {
      netAmount = amountInRub * 0.87;
    }
    // if already net or unspecified, keep as is
  
    // round to nearest 5000
    const rounded = Math.round(netAmount / 5000) * 5000;
  
    return { 
      salary_min_net: rounded > 0 ? String(rounded) : "", 
      salary_currency: "RUB" 
    };
  }
  
  function buildLocationDisplay(city, metro) {
    const c = cleanText(city);
    const m = cleanText(metro);
    if (c && m) return `${c} — ${m}`;
    return c || m || "";
  }
  
  function toYamlInlineArray(arr) {
    const items = (arr || []).map((x) => (x || "").toString());
    const escaped = items.map((x) => `"${x.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    return `[${escaped.join(", ")}]`;
  }

  // --- Date parsing helpers ---

  const RUSSIAN_MONTHS = {
    "января": 1, "февраля": 2, "марта": 3, "апреля": 4,
    "мая": 5, "июня": 6, "июля": 7, "августа": 8,
    "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12
  };

  function parseRussianDate(text) {
    // Parses "23 декабря 2025" or "23 декабря" to YYYY-MM-DD
    if (!text) return "";
    
    const s = cleanText(text).toLowerCase();
    
    // Try to extract: day + month + optional year
    const match = s.match(/(\d{1,2})\s*([а-яё]+)(?:\s+(\d{4}))?/);
    if (!match) return "";
    
    const day = parseInt(match[1], 10);
    const monthName = match[2];
    const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
    
    const month = RUSSIAN_MONTHS[monthName];
    if (!month || day < 1 || day > 31) return "";
    
    // Format as YYYY-MM-DD
    const yyyy = String(year);
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseISODate(text) {
    // Parses ISO datetime like "2025-12-20T09:27:04+03:00"
    if (!text) return "";
    
    try {
      const date = new Date(text);
      if (isNaN(date.getTime())) return "";
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      
      return `${yyyy}-${mm}-${dd}`;
    } catch (_) {
      return "";
    }
  }
  // --- Filename helpers (Windows-safe) ---

const LEVEL_ABBREV = {
  intern: "INT",
  junior: "J",
  "junior+": "J+",
  middle: "M",
  senior: "S"
};

// Keep keys lowercase
const ROLE_ABBREV = {
  "data analyst": "DA",
  "product analyst": "PA",
  "bi analyst": "BI",
  "data scientist": "DS",
  "ml engineer": "MLE",
  "data engineer": "DE"
};

function cleanCompanyName(company) {
  let s = (company || "").toString().trim();
  
  // Remove common prefixes like "Прямой работодатель"
  s = s.replace(/^(Прямой\s+работодатель|Direct\s+employer)\s+/gi, "");
  
  // Remove website URLs in parentheses
  s = s.replace(/\s*\([^)]*www\.[^)]*\)/gi, "");
  
  // Remove legal suffixes RU/EN
  s = s.replace(/[,\s]+(ООО|ОАО|ЗАО|ПАО|АО|ИП|Ltd\.?|LLC|Inc\.?|GmbH|S\.A\.|Corp\.?|Co\.?|LTD)\b\.?/gi, "");
  
  // Remove trailing legal suffixes without comma
  s = s.replace(/\s+(ООО|ОАО|ЗАО|ПАО|АО|ИП|Ltd\.?|LLC|Inc\.?|GmbH|S\.A\.|Corp\.?|Co\.?|LTD)\b\.?$/gi, "");
  
  // Clean up quotes, extra spaces
  s = s.trim().replace(/^["'«»\s]+|["'«»\s]+$/g, "");
  s = s.replace(/\s+/g, " ");
  
  return s || "Unknown";
}

// Windows invalid: <>:"/\|?* plus ASCII control 0x00-0x1F
function sanitizeFilenameComponent(input, maxLen = 120) {
  let s = (input || "").toString().trim();
  s = s.replace(/ё/gi, (m) => (m === "Ё" ? "Е" : "е"));

  // replace invalid chars + control chars with space
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ");

  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  // Windows forbids trailing dot/space
  s = s.replace(/[ .]+$/g, "");

  if (!s) s = "Unknown";

  // Reserved names (case-insensitive)
  const upper = s.toUpperCase();
  const reserved = new Set([
    "CON", "PRN", "AUX", "NUL",
    "COM1","COM2","COM3","COM4","COM5","COM6","COM7","COM8","COM9",
    "LPT1","LPT2","LPT3","LPT4","LPT5","LPT6","LPT7","LPT8","LPT9"
  ]);
  if (reserved.has(upper)) s = "_" + s;

  if (s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/[ .]+$/g, "");
    if (!s) s = "Unknown";
  }
  return s;
}

function getRoleAbbrev(role, roleNorm = "") {
  const text = ((roleNorm || role || "") + "").toLowerCase();

  for (const [fullRole, abbrev] of Object.entries(ROLE_ABBREV)) {
    if (text.includes(fullRole)) return abbrev;
  }

  // fallback: first letters of first two words
  const words = (roleNorm || role || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return "__";
}

function generateFilename(metadata) {
  const company = sanitizeFilenameComponent(cleanCompanyName(metadata?.company), 120);
  const role = (metadata?.role || "").toString();
  const roleNorm = (metadata?.role_norm || "").toString();
  const level = (metadata?.level || "").toString().toLowerCase();

  const roleAbbrev = getRoleAbbrev(role, roleNorm);

  const parts = [company, roleAbbrev];
  if (level && LEVEL_ABBREV[level]) parts.push(`-${LEVEL_ABBREV[level]}`);

  const filename = sanitizeFilenameComponent(parts.join(" "), 120) + ".md";
  return filename;
}