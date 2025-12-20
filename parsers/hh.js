function parseHH() {
    // HH has great stable selectors via data-qa
    const role = pickText(['[data-qa="vacancy-title"]', "h1"]) || "";
  
    const company = pickText([
      '[data-qa="vacancy-company-name"]',
      '[data-qa="vacancy-company"] a',
      'a[data-qa="vacancy-company-name"]'
    ]);
  
    const salary = pickText(['[data-qa="vacancy-salary"]', '[data-qa="vacancy-salary-compensation-type"]']);
  
    const work_mode = pickText([
      '[data-qa="work-formats-text"]',
      '[data-qa="vacancy-view-employment-mode"]',
      '[data-qa="vacancy-view-work-schedule"]'
    ]);
  
    // Extract experience for level inference
    const experience = pickText(['[data-qa="vacancy-experience"]']);
  
    // Location parsing: HH has specific structure
    // [data-qa="vacancy-view-raw-address"] contains: "Москва, <metro>, <street>"
    // [data-qa="address-metro-station-name"] contains just metro name
    const locationLine = pickText([
      '[data-qa="vacancy-view-raw-address"]',
      '[data-qa="vacancy-view-location"]'
    ]);
  
    let location_city = "";
    let location_metro = "";
    
    // Extract city: first part before comma
    if (locationLine) {
      const cityMatch = locationLine.match(/^([^,]+)/);
      if (cityMatch) {
        location_city = cleanText(cityMatch[1]);
      }
    }
    
    // Extract metro station name from dedicated element
    const metroElement = document.querySelector('[data-qa="address-metro-station-name"]');
    if (metroElement) {
      location_metro = cleanText(metroElement.textContent || metroElement.innerText || "");
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
      experience, // Pass experience for level inference
      source: "hh.ru"
    };
  }
  