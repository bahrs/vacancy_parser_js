// content.js - Extracts vacancy data from HH.ru pages

function parseVacancy() {
  const data = {
    url: window.location.href,
    role: '',
    company: '',
    salary: '',
    workMode: 'unspecified',
    location: '',
    experience: '',
    employment: '',
    schedule: '',
    skills: [],
    description: ''
  };

  // Extract role/title
  const titleElement = document.querySelector('[data-qa="vacancy-title"]');
  if (titleElement) {
    data.role = titleElement.textContent.trim();
  }

  // Extract company
  const companyElement = document.querySelector('[data-qa="vacancy-company-name"]');
  if (companyElement) {
    data.company = companyElement.textContent.trim();
  }

  // Extract salary
  const salaryElement = document.querySelector('[data-qa="vacancy-salary-compensation-type-net"]') || 
                        document.querySelector('[data-qa="vacancy-salary"]');
  if (salaryElement) {
    data.salary = salaryElement.textContent.trim();
  }

  // Extract location
  const locationElement = document.querySelector('[data-qa="vacancy-view-location"]');
  if (locationElement) {
    data.location = locationElement.textContent.trim();
  }

  // Extract experience
  const experienceElement = document.querySelector('[data-qa="vacancy-experience"]');
  if (experienceElement) {
    data.experience = experienceElement.textContent.trim();
  }

  // Extract employment type
  const employmentElement = document.querySelector('[data-qa="vacancy-view-employment-mode"]');
  if (employmentElement) {
    data.employment = employmentElement.textContent.trim();
  }

  // Extract work schedule
  const scheduleElement = document.querySelector('[data-qa="vacancy-view-employment-schedule"]');
  if (scheduleElement) {
    data.schedule = scheduleElement.textContent.trim();
  }

  // Detect work mode from text
  const pageText = document.body.textContent.toLowerCase();
  if (pageText.includes('удалённо') || pageText.includes('удаленно') || pageText.includes('remote')) {
    data.workMode = 'remote';
  } else if (pageText.includes('гибрид') || pageText.includes('hybrid')) {
    data.workMode = 'hybrid';
  } else if (pageText.includes('офис') || pageText.includes('office')) {
    data.workMode = 'office';
  }

  // Extract key skills
  const skillElements = document.querySelectorAll('[data-qa="skills-element"]');
  skillElements.forEach(el => {
    const skillText = el.textContent.trim();
    if (skillText) {
      data.skills.push(skillText);
    }
  });

  // Extract full description
  const descElement = document.querySelector('[data-qa="vacancy-description"]');
  if (descElement) {
    data.description = descElement.textContent.trim();
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'parseVacancy') {
    try {
      const vacancyData = parseVacancy();
      sendResponse({ success: true, data: vacancyData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep channel open for async response
});