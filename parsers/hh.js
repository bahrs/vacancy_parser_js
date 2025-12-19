function parseHH() {
    // HH has great stable selectors via data-qa
    const role = pickText(['[data-qa="vacancy-title"]', "h1"]) || "";
  
    const company = pickText([
      '[data-qa="vacancy-company-name"]',
      '[data-qa="vacancy-company"] a',
      'a[data-qa="vacancy-company-name"]'
    ]);
  
    const salary = pickText(['[data-qa="vacancy-salary"]', '[data-qa="vacancy-salary-compensation-type"]']);
  
    const work_mode = pickText(['[data-qa="vacancy-view-employment-mode"]', '[data-qa="vacancy-view-work-schedule"]']);
  
    const locationLine = pickText([
      '[data-qa="vacancy-view-raw-address"]',
      '[data-qa="vacancy-view-location"]',
      'div[data-qa="vacancy-view-raw-address"]'
    ]);
  
    // heuristic: city first token before comma
    let location_city = "";
    let location_metro = "";
    if (locationLine) {
      const parts = locationLine.split(",").map((x) => cleanText(x));
      location_city = parts[0] || "";
      // metro can be repeated like "Деловой центр, Деловой центр..."
      if (parts.length > 1) {
        location_metro = parts
          .slice(1)
          .map((x) => x.replace(/^м\.\s*/i, ""))
          .join(", ");
      }
    }
  
    const skills = pickAllText(['[data-qa="skills-element"]', 'a[data-qa="bloko-tag__text"]']);
  
    const description = pickText(['[data-qa="vacancy-description"]', "main"]) || "";
  
    return {
      role,
      company,
      salary,
      location_city,
      location_metro,
      work_mode,
      skills,
      job_description_raw: description,
      source: "hh.ru"
    };
  }
  