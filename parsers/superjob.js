function parseSuperjob() {
    const role = pickText(["h1", "title"]) || "";
  
    const company =
      pickText(["[class*='Company']", ".company", ".vacancy-company", "a[href*='/clients/']"]) ||
      "";
  
    const salary = pickText(["[class*='salary']", ".salary", ".VacancySalary"]) || "";
  
    const rawText = document.body?.innerText || "";
    const work_mode = inferWorkMode(rawText);
  
    const skills = dedupeArray(
      pickAllText(["a.tag", ".tags a", "[class*='tag'] a", "[class*='skills'] a"])
    );
  
    // Superjob pages vary a lot; main/article usually OK
    const description =
      pickText(["article", "main", "[class*='description']", ".vacancy-description"]) ||
      "";
  
    // location is often in the header area
    const location_city =
      pickText(["[class*='address']", "[class*='location']", ".address", ".location"]) ||
      "";
  
    return {
      role,
      company,
      salary,
      location_city,
      location_metro: "",
      work_mode,
      skills,
      job_description_raw: description,
      source: "superjob.ru"
    };
  }  