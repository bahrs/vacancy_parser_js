function parseHabr() {
  const role = pickText(["h1"]) || "";

  // Company: extract from vacancy-company__title block
  const company = pickText([
      ".company_name a",
      ".vacancy-company__title a",
      'a[href^="/companies/"]'
  ]) || "";

  // Salary: specific selector for Habr's salary display
  const salaryRaw = pickText([
      ".vacancy-header__salary-title",
      ".vacancy-salary",
      ".salary"
  ]) || "";
  
  // Convert "Не указана" to empty string
  const salary = /не\s*указан[аоы]?/i.test(salaryRaw) ? "" : salaryRaw;

  // Location: extract from Местоположение section
  const location_address = pickText([
      '.content-section a[href^="/vacancies?city_id="]',
      'a[href*="city_id="]',
      ".vacancy-location"
  ]) || "";

  // Work mode: extract from location/employment section
  // Look for the section with "Местоположение и тип занятости" header
  let work_mode = "";
  const sections = document.querySelectorAll(".content-section");
  for (const section of sections) {
      const headerText = section.querySelector(".content-section__title")?.textContent || "";
      if (/местоположение/i.test(headerText)) {
          const locationText = cleanText(section.innerText || "");
          work_mode = inferWorkMode(locationText);
          break;
      }
  }
  
  // Fallback if not found in section
  if (!work_mode || work_mode === "unspecified") {
      const rawText = document.body?.innerText || "";
      work_mode = inferWorkMode(rawText);
  }

  // Level: extract from Requirements section
  // Look for links like "Младший (Junior)", "Средний (Middle)", etc.
  const levelLink = pickText([
      'a[href="/vacancies?qid=3"]', // Junior
      'a[href="/vacancies?qid=4"]', // Middle
      'a[href="/vacancies?qid=5"]', // Senior
      'a[href*="qid="]'
  ]) || "";

  // Skills/tags: Habr uses specific tag links
  const skills = dedupeArray(
      pickAllText([
          'a[href^="/skills/"]',
          ".vacancy-section__tags a",
          "a.tag"
      ])
  );

  // Description: extract from vacancy-description__text
  const description = pickText([
      ".vacancy-description__text",
      ".vacancy-description",
      "article",
      "main"
  ]) || "";

  return {
      role,
      company,
      salary,
      location_address,
      location_metro: "", // Habr doesn't typically show metro stations
      work_mode,
      levelLink, // Pass this for inference
      skills,
      job_description_raw: description,
      source: "career.habr.com"
  };
}