function parseHHLocation() {
    // Custom parsing for HH.ru location structure:
    // <span data-qa="vacancy-view-raw-address">
    //   Москва<!-- --><span class="metro-station">...</span>, адрес
    // </span>
    
    const addressEl = document.querySelector('[data-qa="vacancy-view-raw-address"]');
    if (!addressEl) {
        // Fallback to simple parsing
        const location_address = pickText(['[data-qa="vacancy-view-location"]', 'div[data-qa="vacancy-view-raw-address"]']);
        const location_metro = pickText(['[data-qa="address-metro-station-name"]']);
        return { location_address: location_address || "", location_metro: location_metro || "" };
    }
    
    // Extract all metro station names first (before we remove them)
    const metroStations = [];
    const metroElements = addressEl.querySelectorAll('.metro-station [data-qa="address-metro-station-name"]');
    metroElements.forEach(el => {
        const name = cleanText(el.textContent || "");
        if (name && !metroStations.includes(name)) {
            metroStations.push(name);
        }
    });
    // Fallback: if no data-qa found, try direct metro-station text
    if (metroStations.length === 0) {
        const metroSpans = addressEl.querySelectorAll('.metro-station');
        metroSpans.forEach(span => {
            const name = cleanText(span.textContent || "");
            if (name && !metroStations.includes(name)) {
                metroStations.push(name);
            }
        });
    }
    
    // Clone the element and remove all metro-station elements to get clean address
    const clone = addressEl.cloneNode(true);
    const metroToRemove = clone.querySelectorAll('.metro-station');
    metroToRemove.forEach(el => el.remove());
    
    // Extract text: this gives us city + address (without metro stations)
    const location_address = cleanText(clone.textContent || "");
    
    // Join distinct metro stations with commas
    const location_metro = metroStations.join(", ");
    
    return { location_address, location_metro };
}

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
  
    // Parse location with custom logic
    const { location_address, location_metro } = parseHHLocation();
  
    const skills = pickAllText(['[data-qa="skills-element"]', 'a[data-qa="bloko-tag__text"]']);
  
    const description = pickText(['[data-qa="vacancy-description"]', "main"]) || "";
    
    // Extract experience requirement for level inference
    const experience = pickText(['[data-qa="vacancy-experience"]']);

    return {
      role,
      company,
      salary,
      location_address,
      location_metro,
      work_mode,
      skills,
      experience,
      job_description_raw: description,
      source: "hh.ru"
    };
  }
  