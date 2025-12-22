function parseGeekjob() {
    // Geekjob can be dynamic; be tolerant
    const role = pickText(["h1", "title"]) || "";
  
    const company =
      pickText([".company-name", ".vacancy-company", ".job-company", "a[href*='/companies/']"]) ||
      "";
  
    const salary = pickText([".salary", ".vacancy-salary", "[class*='salary']"]) || "";
  
    const rawText = document.body?.innerText || "";
    const work_mode = inferWorkMode(rawText);
  
    const skills = dedupeArray(
      pickAllText(["a.tag", ".tags a", "[class*='tag'] a", "[class*='skills'] a"])
    );
  
    const description =
      pickText(["article", "main", ".vacancy-description", ".job-description"]) ||
      "";
  
    return {
      role,
      company,
      salary,
      location_city: "",
      location_metro: "",
      work_mode,
      skills,
      job_description_raw: description,
      source: "geekjob"
    };
  }  