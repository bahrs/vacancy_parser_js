// parsers/superjob.js

function cutBefore(text, marker) {
    const s = (text || "").toString();
    const i = s.indexOf(marker);
    return i >= 0 ? s.slice(0, i) : s;
  }
  
  // CSS cannot match by text, so we scan elements and match by regex
  function pickTextByRegex(selector, re, root = document) {
    try {
      const els = root.querySelectorAll(selector);
      for (const el of els) {
        const t = cleanText(el?.innerText || el?.textContent || "");
        if (t && re.test(t)) return t;
      }
    } catch (_) {}
    return "";
  }
  
  function parseSuperjobLocation() {
    // Both address and metro can share the same “hashy” class set on Superjob.
    // We use heuristics:
    // - address usually has comma + digits (street/house)
    // - metro is usually a single word, no digits, no comma
  
    const candidates = dedupeArray(
      pickAllText([
        // your exact samples:
        "span._23xe3._2_ehB._3H8Cg._3Tn5h",
        "span._23xe3._3H8Cg._3Tn5h",
        "span._23xe3._3H8Cg",
        // fallbacks:
        "span[class*='_23xe3'][class*='_3H8Cg']",
        "[class*='address'] span",
        "[class*='location'] span"
      ])
    )
      .map(cleanText)
      .filter(Boolean);
  
    const address =
      candidates.find((t) => /,/.test(t) && /\d/.test(t)) ||
      candidates.find((t) => /(москва|санкт|петербург|екатеринбург|новосибирск)/i.test(t) && /,/.test(t)) ||
      "";
  
    const metro =
      candidates.find((t) => t && t !== address && !/[,\d]/.test(t) && t.length <= 40) || "";
  
    return { location_address: address, location_metro: metro };
  }
  
  function parseSuperjob() {
    // 1) ROLE
    const role = pickText(["h1", "title"]) || "";
  
    // Company name (Superjob varies; keep multiple fallbacks)
    const company =
      pickText([
        "a[href*='/clients/']",
        "a[href*='/clients/'] span",
        "[class*='Company'] a",
        "[class*='company'] a",
        ".company a",
        ".vacancy-company a"
      ]) ||
      getMetaContent("og:site_name") ||
      "";
  
    // 2) SALARY (your sample: <span class="kk-+S ...">от 75 000 ₽</span>)
    // IMPORTANT: class contains "+", so we must escape it in CSS: .kk-\+S
    const salary =
      pickText([
        "span.kk-\\+S",
        "span[class*='kk-']",
        "[class*='VacancySalary']",
        "[class*='salary']",
        ".salary"
      ]) || "";
  
    // 4) EXPERIENCE (for level inference)
    // your sample: <span class="bMRJG ...">Опыт работы от 1 года</span>
    const experience =
      pickTextByRegex("span", /опыт\s*работы/i) ||
      pickText([
        "span.bMRJG._2_ehB._3Tn5h",
        "span.bMRJG",
        "[class*='Experience']"
      ]) ||
      "";
  
    // 3) + 5) LOCATION + METRO
    const { location_address, location_metro } = parseSuperjobLocation();
  
    // 6) WORK MODE (raw text contains "очный")
    const rawPageText = document.body?.innerText || "";
    const work_mode = inferWorkMode(rawPageText);
  
    // 7) RAW TEXT delimiter: "Похожие вакансии" (div.rE6yH)
    // We take main/article/body and cut before marker text.
    const mainText = pickText(["main", "article"]) || rawPageText;
    const description = cleanText(cutBefore(mainText, "Похожие вакансии"));
  
    // Skills/tags (best-effort)
    const skills = dedupeArray(
      pickAllText([
        "a.tag",
        ".tags a",
        "[class*='tag'] a",
        "[class*='skills'] a"
      ])
    );
  
    return {
      role,
      company,
      salary,
      experience,
      location_address,
      location_metro,
      work_mode,
      skills,
      job_description_raw: description,
      source: "superjob.ru"
    };
  }
  