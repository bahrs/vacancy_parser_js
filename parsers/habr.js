function parseHabr() {
    const role = pickText(["h1"]) || "";
  
    // Company often is a link in "Компания" block
    const company =
      pickText(['a[href^="/companies/"]']) ||
      pickText(['section a[href*="companies"]']) ||
      pickText([".vacancy-company__title a", ".company_name a", "a.company_name"]) ||
      "";
  
    // location text is often in a block that contains "Местоположение"
    const locationText =
      pickText([".content-section:has(h2)"]) || // may fail in some browsers (no :has)
      pickText(["main"]) ||
      "";
  
    let location_city = "";
    // simplest: try obvious fragments on the page
    location_city =
      pickText([".vacancy-location", ".vacancy__location", ".location"]) ||
      ""; // fallback below
  
    if (!location_city && locationText) {
      // Try to take first occurrence of "Москва" / "Санкт-Петербург" etc from main text
      const m = locationText.match(/\b(Москва|Санкт-Петербург|Нижний Новгород|Казань|Екатеринбург|Новосибирск|Минск|Алматы)\b/i);
      if (m) location_city = m[1];
    }
  
    // Work mode: search for "Можно удаленно"/"Гибрид"
    const rawText = document.body?.innerText || "";
    const work_mode = inferWorkMode(rawText);
  
    // Skills/tags near top: anchors that look like tags
    const skills = dedupeArray(
      pickAllText([
        'a[href^="/skills/"]',
        "a.tag",
        ".tags a",
        ".vacancy__skills a",
        ".vacancy-section__tags a"
      ])
    );
  
    // Description: section titled "Описание вакансии" often inside main/article
    const description =
      pickText(["article", "main"]) ||
      "";
  
    return {
      role,
      company,
      salary: pickText([".basic-salary", ".vacancy-salary", ".salary"]) || "",
      location_city,
      location_metro: "",
      work_mode,
      skills,
      job_description_raw: description,
      source: "career.habr.com"
    };
  }  