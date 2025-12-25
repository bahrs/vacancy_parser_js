// lib/tech_stack.js
// Requires lib/normalize.js loaded first (cleanText, dedupeArray)

function normText(s) {
    s = (s || "").toString().toLowerCase();
    s = s.replace(/ё/g, "е");
    s = s.replace(/\u00a0/g, " "); // NBSP
    s = s.replace(/[–—−]/g, "-");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }
  
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  
  // Python alias_to_regex port
  function aliasToRegex(alias) {
    let a = normText(alias);
    a = escapeRegExp(a);
    a = a.replace(/\\-/g, "[-\\s]*");
    a = a.replace(/\\ /g, "[-\\s]*");
  
    const left = "(^|[^a-zа-я0-9])";
    const right = "([^a-zа-я0-9]|$)";
    return new RegExp(left + a + right, "i");
  }
  
  function compileTechStack(obj) {
    const skills = (obj && obj.skills) || {};
    const compiled = []; // [{canon, area, rx}]
    const implies = {};  // canon -> deps[]
  
    for (const [canon, meta] of Object.entries(skills)) {
      if (!meta || typeof meta !== "object") continue;
      const area = meta.area || "";
      const aliases = Array.isArray(meta.aliases) ? meta.aliases : [];
      implies[canon] = Array.isArray(meta.implies) ? meta.implies : [];
  
      for (const alias of aliases) {
        if (typeof alias !== "string" || !alias.trim()) continue;
        compiled.push({ canon, area, rx: aliasToRegex(alias) });
      }
    }
  
    return { compiled, implies };
  }
  
  function expandImplies(found, implies) {
    const q = Array.from(found);
    while (q.length) {
      const cur = q.pop();
      for (const dep of (implies[cur] || [])) {
        if (!found.has(dep)) {
          found.add(dep);
          q.push(dep);
        }
      }
    }
  }
  
  // exported: extract skills
  function extractSkillsFromText(text, tech) {
    if (!text || !tech) return [];
    const t = normText(text);
    const found = new Set();
  
    for (const item of (tech.compiled || [])) {
      if (item.rx.test(t)) found.add(item.canon);
    }
  
    expandImplies(found, tech.implies || {});
    return Array.from(found).sort();
  }
  
  // stack picking (same priority idea as your Python)
  const STACK_PRIORITY = [
    "python", "sql", "r",
    "postgresql", "clickhouse", "mysql",
    "airflow", "mlflow", "docker", "docker compose",
    "spark", "pyspark", "hadoop",
    "power bi", "tableau", "datalens", "superset", "grafana",
    "git", "jira", "confluence",
  ];
  
  function pickStack(skills, maxItems = 6) {
    const sset = new Set(skills || []);
    let out = STACK_PRIORITY.filter((x) => sset.has(x));
    if (!out.length) out = (skills || []).slice();
    return out.slice(0, maxItems);
  }
  
  // Initialize once (global)
  (function initTech() {
    if (!window.TECH_STACK_DATA) {
      window.TECH_STACK = null;
      return;
    }
    window.TECH_STACK = compileTechStack(window.TECH_STACK_DATA);
    window.extractTechSkillsFromText = (text) => extractSkillsFromText(text, window.TECH_STACK);
    window.pickTechStack = (skills, maxItems = 6) => pickStack(skills, maxItems);
  })();
  