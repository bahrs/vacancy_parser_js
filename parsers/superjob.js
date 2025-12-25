// parsers/superjob.js - Rewritten for text-based parsing due to obfuscated selectors

function cutBefore(text, marker) {
  const s = (text || "").toString();
  const i = s.indexOf(marker);
  return i >= 0 ? s.slice(0, i) : s;
}

function cutAfter(text, marker) {
  const s = (text || "").toString();
  const i = s.indexOf(marker);
  return i >= 0 ? s.slice(i + marker.length) : s;
}

function extractBetween(text, start, end) {
  const s = (text || "").toString();
  const startIdx = start ? s.indexOf(start) : 0;
  if (startIdx === -1) return s;
  
  const searchFrom = startIdx + (start ? start.length : 0);
  const endIdx = end ? s.indexOf(end, searchFrom) : s.length;
  
  if (endIdx === -1) return s.slice(searchFrom);
  return s.slice(searchFrom, endIdx);
}

function parseSuperjobFromText() {
  // Get the full page text
  const rawPageText = document.body?.innerText || "";
  
  // 1) ROLE - still try H1 first as it's reliable
  const role = pickText(["h1"]) || "";
  
  // 2) COMPANY - try link selector, fallback to meta, then clean
  let company = pickText([
    "a[href*='/clients/']",
    "a[href*='/clients/'] span",
    "[class*='Company'] a"
  ]) || getMetaContent("og:site_name") || "";
  company = cleanCompanyName(company);
  
  // 3) SALARY - look for pattern in text: "от XXX ₽" or "до XXX ₽" or "XXX - XXX ₽"
  let salary = "";
  const salaryMatch = rawPageText.match(/(от|до)?\s*(\d[\d\s]*)\s*(?:[-–—]\s*(\d[\d\s]*))?\s*₽/i);
  if (salaryMatch) {
    salary = salaryMatch[0].trim();
  }
  
  // 4) EXPERIENCE - search for "Опыт работы" pattern in text
  let experience = "";
  const expMatch = rawPageText.match(/Опыт работы[:\s]+([^\n]+)/i);
  if (expMatch) {
    experience = cleanText(expMatch[1]);
  }
  
  // 5) LOCATION & METRO - extract from text patterns
  let location_address = "";
  let location_metro = "";
  
  // Look for city names
  const cityMatch = rawPageText.match(/(Москва|Санкт-Петербург|Петербург|Екатеринбург|Новосибирск|Казань|Нижний Новгород|Челябинск|Самара|Омск|Ростов-на-Дону|Уфа|Красноярск|Воронеж|Пермь|Волгоград)[,\s]/i);
  if (cityMatch) {
    const city = cityMatch[1];
    location_address = city;
    
    // Look for metro: "метро [Station Name]" pattern
    const metroPattern = /метро\s+([А-ЯЁ][а-яё\s-]+?)(?=[,.\n]|$)/gi;
    const metroMatches = [...rawPageText.matchAll(metroPattern)];
    if (metroMatches.length > 0) {
      // Take first metro station found
      location_metro = cleanText(metroMatches[0][1]);
      
      // If multiple stations, join them
      if (metroMatches.length > 1) {
        const stations = metroMatches.map(m => cleanText(m[1])).filter(Boolean);
        location_metro = dedupeArray(stations).join(", ");
      }
    }
    
    // Look for street address after city
    const addressPattern = new RegExp(city + ".*?(улица|ул\\.|проспект|пр\\.|переулок|пер\\.|бульвар|б-р|площадь|пл\\.|шоссе)[^\\n]{5,60}", "i");
    const addressMatch = rawPageText.match(addressPattern);
    if (addressMatch) {
      let fullAddress = cleanText(addressMatch[0]);
      // Remove metro station from address if it's there
      if (location_metro) {
        fullAddress = fullAddress.replace(/метро\s+[^,]+,?\s*/gi, "");
      }
      location_address = fullAddress;
    }
  }
  
  // 6) WORK MODE - infer from full text
  const work_mode = inferWorkMode(rawPageText);
  
  // 7) DESCRIPTION - extract between typical markers and cut at "Выберите сообщение"
  let description = rawPageText;
  
  // Try to find the start of actual description
  const descStartMarkers = ["Обязанности:", "Требования:", "Условия:", "Описание вакансии", "№ "];
  let descStart = -1;
  
  for (const marker of descStartMarkers) {
    const idx = description.indexOf(marker);
    if (idx !== -1 && (descStart === -1 || idx < descStart)) {
      descStart = idx;
    }
  }
  
  if (descStart !== -1) {
    description = description.slice(descStart);
  }
  
  // Cut at various end markers (in order of priority)
  const endMarkers = [
    "Выберите сообщение",
    "Похожие вакансии",
    "Вакансии в других городах",
    "Смотреть все вакансии"
  ];
  
  for (const marker of endMarkers) {
    description = cutBefore(description, marker);
  }
  
  description = cleanText(description);
  
  // 8) SKILLS - rely on tech stack extraction from raw text
  const skills = [];
  
  // 9) PUBLISH DATE - look for date pattern in text
  let publish_date = "";
  try {
    // Look in first 1500 chars for date
    const topText = rawPageText.slice(0, 1500);
    const dateMatch = topText.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
    if (dateMatch) {
      publish_date = parseRussianDate(dateMatch[0]);
    }
  } catch (_) {}
  
  return {
    role,
    company,
    salary,
    experience,
    location_address,
    location_metro,
    work_mode,
    skills,
    publish_date,
    job_description_raw: description,
    source: "superjob.ru"
  };
}

function parseSuperjob() {
  return parseSuperjobFromText();
}