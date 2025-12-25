function parseGeekjob() {
  // Geekjob can be dynamic; be tolerant
  const role = pickText(["h1", "title"]) || "";

  // Clean company name - extract only from the link text, not the full h5
  let company = "";
  try {
    // Target the link specifically: h5.company-name > a
    const companyLink = document.querySelector("h5.company-name a, .company-name a");
    if (companyLink) {
      company = cleanText(companyLink.textContent || companyLink.innerText || "");
    }
  } catch (_) {}
  
  // Fallback to other selectors if needed
  if (!company) {
    company = pickText([".vacancy-company", ".job-company"]) || "";
  }
  
  // Apply company name cleaning
  company = cleanCompanyName(company);

  const salary = pickText([".salary", ".vacancy-salary", "[class*='salary']"]) || "";

  const rawText = document.body?.innerText || "";
  const work_mode = inferWorkMode(rawText);

  // Better description targeting - use #vacancy-description if available
  let description = pickText(["#vacancy-description", "div#vacancy-description"]) || "";
  
  // Fallback to general selectors if specific one not found
  if (!description) {
    description = pickText(["article", "main", ".vacancy-description", ".job-description"]) || "";
  }
  
  // If still empty, use full body text
  if (!description) {
    description = rawText;
  }

  // Skills - filter out specializations that might be parsed as skills
  const rawSkills = pickAllText(["a.tag", ".tags a", "[class*='tag'] a", "[class*='skills'] a"]);
  
  // Filter out common specialization terms
  const specializationTerms = new Set([
    "вакансии", "работа", "компания", "офис", "удаленно", "гибрид",
    "полная занятость", "частичная занятость", "проектная работа",
    "intern", "junior", "middle", "senior", "lead"
  ]);
  
  const skills = dedupeArray(
    rawSkills.filter(skill => {
      const lower = skill.toLowerCase();
      return !specializationTerms.has(lower) && skill.length > 2;
    })
  );
  
  // Parse publish date
  let publish_date = "";
  try {
    const timeText = pickText([".time", "div.time", "[class*='time']"]) || "";
    if (timeText) {
      publish_date = parseRussianDate(timeText);
    }
  } catch (_) {}

  return {
    role,
    company,
    salary,
    location_city: "",
    location_metro: "",
    work_mode,
    skills,
    publish_date,
    job_description_raw: description,
    source: "geekjob"
  };
}