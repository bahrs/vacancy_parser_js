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
      { key: "Data Analyst", re: /(data\s*analyst|аналитик\s*данных|дата\s*аналитик)/i },
      { key: "Product Analyst", re: /(product\s*analyst|продуктов(ый|ая)\s*аналитик)/i },
      { key: "BI Analyst", re: /(bi\s*analyst|аналитик\s*bi|power\s*bi|business\s*intelligence)/i },
      { key: "Data Scientist", re: /(data\s*scientist|дата\s*сайентист|machine\s*learning|ml\s*(engineer)?|ml\b)/i },
      { key: "ML Engineer", re: /(ml\s*engineer|machine\s*learning\s*engineer|mle\b)/i },
      { key: "Data Engineer", re: /(data\s*engineer|инженер\s*данных|dwh\s*engineer?|airflow)/i }
    ];
  
    for (const r of rules) {
      if (r.re.test(t)) return r.key;
    }
    return cleanText(role);
  }
  
  function inferLevel(role, text, experience) {
    const t = `${role || ""}\n${text || ""}\n${experience || ""}`.toLowerCase();
  
    if (/\b(intern|internship|стаж(е|ё)р|стажировка)\b/i.test(t)) return "intern";
    if (/\b(junior|джун|младш(ий|ая))\b/i.test(t)) return "junior";
    if (/\bjunior\s*\+\s*(?:\\|\/)?\s*(?:middle|mid)?/i.test(t)) return "junior+";
    if (/\b(middle|mid|мидл|средн(ий|яя))\b/i.test(t)) return "middle";
    if (/\b(senior|lead|principal|старш(ий|ая)|ведущ(ий|ая))\b/i.test(t)) return "senior";
  
    // Infer from experience requirements
    // "1–3 года", "1-3 года", "от 1 до 3 лет" → junior+
    // "от 2-х и более лет", "2+ года" → junior+ or middle
    // "3+ года", "от 3 лет", "4+ года" → middle or senior
    if (experience) {
      const expLower = experience.toLowerCase();
      
      // Match patterns like "1–3 года", "1-3 года", "от 1 до 3 лет"
      const rangeMatch = expLower.match(/(?:от\s*)?(\d+)[\s–-]+(?:до\s*)?(\d+)\s*(?:лет|года|год)/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        if (min >= 1 && max <= 3) return "junior+";
        if (min >= 3 && max <= 5) return "middle";
      }
      
      // Match patterns like "от 2-х и более лет", "2+ года", "от 2 лет"
      const minMatch = expLower.match(/(?:от\s*)?(\d+)[\s+-]*(?:х|и более|лет|года|год)/);
      if (minMatch) {
        const years = parseInt(minMatch[1], 10);
        if (years <= 1) return "junior";
        if (years === 2) return "junior+";
        if (years === 3) return "middle";
        if (years === 4) return "middle+";
        if (years >= 5) return "senior"; // Could be senior, but default to middle
      }
    }
  
    return "";
  }
  
  function inferWorkMode(text) {
    const t = (text || "").toLowerCase();
  
    // Check for explicit remote first
    if (/(удал(е|ё)нно|remote|fully remote|100% remote)/i.test(t)) return "remote";
    
    // Check for hybrid (can be combined with "на месте")
    if (/(гибрид|hybrid)/i.test(t)) return "hybrid";
    
    // Check for office/onsite
    // "на месте работодателя" or "на месте" or "офис"
    if (/(на\s*месте\s*работодателя|на\s*месте|офис|office|onsite)/i.test(t)) {
      // If it also mentions hybrid, return hybrid
      if (/(гибрид|hybrid)/i.test(t)) return "hybrid";
      return "office";
    }
  
    return "unspecified";
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