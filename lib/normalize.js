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
      { key: "Data Analyst", re: /(data\s*analyst|аналитик данных|дата\s*аналитик)/i },
      { key: "Product Analyst", re: /(product\s*analyst|продуктов(ый|ая)\s*аналитик)/i },
      { key: "BI Analyst", re: /(bi\s*analyst|аналитик bi|power\s*bi|tableau|datalens|superset|metabase)/i },
      { key: "Data Scientist", re: /(data\s*scientist|дата\s*сайентист|machine\s*learning|ml\s*(engineer)?|ml\b)/i },
      { key: "ML Engineer", re: /(ml\s*engineer|machine\s*learning\s*engineer|mle\b)/i },
      { key: "Data Engineer", re: /(data\s*engineer|инженер данных|dwh|etl|spark|hadoop|airflow)/i }
    ];
  
    for (const r of rules) {
      if (r.re.test(t)) return r.key;
    }
    return cleanText(role);
  }
  
  function inferLevel(role, text) {
    const t = `${role || ""}\n${text || ""}`.toLowerCase();
  
    if (/\b(intern|internship|стаж(е|ё)р|стажировка)\b/i.test(t)) return "intern";
    if (/\b(junior|джун|младш(ий|ая))\b/i.test(t)) return "junior";
    if (/\b(middle|mid|мидл|средн(ий|яя))\b/i.test(t)) return "middle";
    if (/\b(senior|lead|principal|старш(ий|ая)|ведущ(ий|ая))\b/i.test(t)) return "senior";
  
    return "";
  }
  
  function inferWorkMode(text) {
    const t = (text || "").toLowerCase();
  
    if (/(удал(е|ё)нно|remote|fully remote|100% remote)/i.test(t)) return "remote";
    if (/(гибрид|hybrid)/i.test(t)) return "hybrid";
    if (/(офис|office|на месте|onsite)/i.test(t)) return "office";
  
    return "unspecified";
  }
  
  function parseSalaryMinNetAndCurrency(salaryText) {
    const s = (salaryText || "").toLowerCase();
  
    // currency
    let salary_currency = "";
    if (/[₽]|руб/.test(s)) salary_currency = "RUB";
    else if (/[€]|eur/.test(s)) salary_currency = "EUR";
    else if (/\$|usd/.test(s)) salary_currency = "USD";
  
    // min number
    const nums = (salaryText || "").match(/\d[\d\s\u00A0]*\d|\d/g) || [];
    const values = nums
      .map((x) => parseInt(x.replace(/[^\d]/g, ""), 10))
      .filter((n) => Number.isFinite(n));
  
    const min = values.length ? Math.min(...values) : "";
  
    // net/gross heuristic
    // (you asked for min net; if we detect "до вычета" -> it's gross; keep empty net)
    const isGross =
      /(до\s*вычета|gross|до\s*налогов|before\s*tax)/i.test(salaryText || "");
    const isNet =
      /(на\s*руки|net|после\s*вычета|after\s*tax)/i.test(salaryText || "");
  
    const salary_min_net = isGross && !isNet ? "" : (min ? String(min) : "");
  
    return { salary_min_net, salary_currency };
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