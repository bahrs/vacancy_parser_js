// popup.js - Handles UI logic and markdown formatting

let currentMarkdown = '';
let currentVacancy = null;

const parseBtn = document.getElementById('parseBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');
const previewDiv = document.getElementById('preview');

// Helper functions
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function inferLevel(role) {
  const r = role.toLowerCase();
  if (r.includes('intern') || r.includes('стаж')) {
    return 'intern';
  }
  if (r.includes('junior+') || r.includes('джун+')) {
    return 'junior+';
  }
  if (r.includes('junior') || r.includes('джуниор')) {
    return 'junior';
  }
  if (r.includes('middle') || r.includes('мидл')) {
    return 'middle';
  }
  if (r.includes('senior') || r.includes('синьор')) {
    return 'senior';
  }
  return 'junior';
}

function classifyPosition(role) {
  const r = role.toLowerCase();
  if (r.includes('data scientist') || r.includes('ds')) {
    return 'Data Scientist';
  }
  if (r.includes('ml engineer') || r.includes('machine learning')) {
    return 'ML Engineer';
  }
  if (r.includes('data engineer') || r.includes('de ')) {
    return 'Data Engineer';
  }
  if (r.includes('product analyst')) {
    return 'Product Analyst';
  }
  if (r.includes('bi analyst') || r.includes('business intelligence')) {
    return 'BI Analyst';
  }
  if (r.includes('data analyst') || r.includes('analyst')) {
    return 'Data Analyst';
  }
  return 'Other';
}

function parseSalary(salaryText) {
  if (!salaryText) return { min: '', currency: 'RUB' };
  
  // Extract numbers
  const numbers = salaryText.match(/\d[\d\s]*/g);
  if (!numbers || numbers.length === 0) return { min: '', currency: 'RUB' };
  
  const cleanNum = numbers[0].replace(/\s/g, '');
  
  // Check if it's net salary
  const isNet = salaryText.toLowerCase().includes('на руки');
  
  return {
    min: isNet ? cleanNum : '',
    currency: 'RUB'
  };
}

function parseLocation(locationText) {
  if (!locationText) return { city: '', metro: '', address: '' };
  
  const parts = locationText.split(',').map(p => p.trim());
  const city = parts[0] || '';
  
  // Try to detect metro station (usually second part without street keywords)
  let metro = '';
  if (parts.length >= 2) {
    const candidate = parts[1];
    const streetKeywords = ['ул', 'улица', 'просп', 'проспект', 'шоссе', 'наб', 'набереж', 'бульвар'];
    const hasStreet = streetKeywords.some(kw => candidate.toLowerCase().includes(kw));
    const hasDigit = /\d/.test(candidate);
    
    if (!hasStreet && !hasDigit && candidate.length <= 40) {
      metro = candidate.replace(/^м\.?\s*/, '');
    }
  }
  
  return {
    city: city,
    metro: metro,
    address: locationText
  };
}

function formatMarkdown(data) {
  const level = inferLevel(data.role);
  const position = classifyPosition(data.role);
  const salary = parseSalary(data.salary);
  const location = parseLocation(data.location);
  
  const skillsList = data.skills.length > 0 
    ? data.skills.map(s => `  - ${s}`).join('\n')
    : '  []';
  
  const metroSuffix = location.metro ? `, м. ${location.metro}` : '';
  
  const markdown = `---
type: application

company: "${data.company}"
role: "${data.role}"
level: ${level}

source: hh.ru
job_link: ${data.url}

work_mode: ${data.workMode}

location_city: "${location.city}"
location_metro: "${location.metro}"
commute_minutes:

salary: ${salary.min}

stack: []
skills:
${skillsList}

status: want to apply
apply_date:
next_action:
next_due:
priority: medium

tags:
  - вакансии
  - job
---

## Snapshot

- **Company:** ${data.company}
- **Role:** ${data.role} (${level})
- **Position Type:** ${position}
- **Location:** ${location.city}${metroSuffix}
- **Address:** ${location.address}
- **Work mode:** ${data.workMode}
- **Commute:** ___ мин
- **Salary (min net):** ${salary.min} ${salary.currency}
- **Source:** hh.ru
- **Link:** ${data.url}

## Job description (raw)

\`\`\`vacancy
${data.description}
\`\`\`

## Cover letter (draft)



## Notes

-
`;

  return markdown;
}

// Event handlers
parseBtn.addEventListener('click', async () => {
  showStatus('Parsing page...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('hh.ru')) {
      showStatus('Please open an HH.ru vacancy page', 'error');
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'parseVacancy' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      
      if (response && response.success) {
        currentVacancy = response.data;
        currentMarkdown = formatMarkdown(response.data);
        
        // Show preview
        previewDiv.textContent = currentMarkdown.substring(0, 500) + '\n\n... (full text ready)';
        previewDiv.style.display = 'block';
        
        // Enable buttons
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
        
        showStatus('✓ Parsed successfully!', 'success');
      } else {
        showStatus('Failed to parse: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

copyBtn.addEventListener('click', async () => {
  if (!currentMarkdown) return;
  
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    showStatus('✓ Copied to clipboard!', 'success');
  } catch (error) {
    showStatus('Failed to copy: ' + error.message, 'error');
  }
});

downloadBtn.addEventListener('click', () => {
  if (!currentMarkdown || !currentVacancy) return;
  
  // Generate filename from role and company
  const sanitize = (str) => str.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').substring(0, 50);
  const filename = `${sanitize(currentVacancy.company)}_${sanitize(currentVacancy.role)}.md`;
  
  // Create download
  const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('✓ Downloaded!', 'success');
});