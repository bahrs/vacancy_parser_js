function parseHHLocation() {
    // Custom parsing for HH.ru location structure:
    // <span data-qa="vacancy-view-raw-address">
    //   Москва<!-- -->, <span class="metro-station">...</span>, адрес
    // </span>
    // We need: first text node (city) + last text node (address), skipping metro stations
    
    const addressEl = document.querySelector('[data-qa="vacancy-view-raw-address"]');
    if (!addressEl) {
        // Fallback to simple parsing
        const location_address = pickText(['[data-qa="vacancy-view-location"]', 'div[data-qa="vacancy-view-raw-address"]']);
        const location_metro = pickText(['[data-qa="address-metro-station-name"]']);
        return { location_address: location_address || "", location_metro: location_metro || "" };
    }
    
    // Extract all metro station names first
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
    
    // Walk through child nodes to find first and last text nodes (skipping metro stations)
    // Structure: "Москва<!-- -->, <metro>...</metro>, адрес"
    // We want: first meaningful text node (city) + last meaningful text node (address)
    
    const textNodes = [];
    
    for (const node of addressEl.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = cleanText(node.textContent || "");
            // Skip text nodes that are just commas/whitespace
            if (text && !/^[,;\s]+$/.test(text)) {
                textNodes.push(text);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip metro station elements completely
            if (node.classList?.contains("metro-station") || node.querySelector('.metro-station')) {
                continue;
            }
            // For other elements, extract their text content
            const text = cleanText(node.textContent || "");
            if (text && !/^[,;\s]+$/.test(text)) {
                textNodes.push(text);
            }
        }
    }
    
    // Combine first and last text nodes
    let location_address = "";
    if (textNodes.length > 0) {
        const firstText = textNodes[0].trim();
        const lastText = textNodes[textNodes.length - 1].trim();
        
        if (textNodes.length === 1) {
            location_address = firstText;
        } else if (firstText !== lastText) {
            // Remove leading comma from lastText if present
            const cleanLast = lastText.replace(/^,\s*/, "").trim();
            location_address = `${firstText}, ${cleanLast}`;
        } else {
            location_address = firstText;
        }
    }
    
    location_address = cleanText(location_address);
    const location_metro = metroStations.join(", ");
    
    return { location_address, location_metro };
}

function parseHH() {
    // HH has great stable selectors via data-qa
    const role = pickText(['[data-qa="vacancy-title"]', "h1"]) || "";
  
    let company = pickText([
      '[data-qa="vacancy-company-name"]',
      '[data-qa="vacancy-company"] a',
      'a[data-qa="vacancy-company-name"]'
    ]);
    company = cleanCompanyName(company);
  
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
    
    // Parse publish date
    let publish_date = "";
    try {
      const pubElements = document.querySelectorAll('[class*="magritte-text"][class*="style-secondary"]');
      for (const el of pubElements) {
        const text = cleanText(el.innerText || el.textContent || "");
        if (/вакансия опубликована/i.test(text)) {
          publish_date = parseRussianDate(text);
          break;
        }
      }
    } catch (_) {}

    return {
      role,
      company,
      salary,
      location_address,
      location_metro,
      work_mode,
      skills,
      experience,
      publish_date,
      job_description_raw: description,
      source: "hh.ru"
    };
  }