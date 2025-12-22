# 📋 Vacancy Parser - Chrome Extension

> One-click parser for Russian job sites → Obsidian-ready Markdown

Parse job vacancies from **HH.ru**, **Career.Habr.com**, **GeekJob.ru**, and **SuperJob.ru** into structured Markdown files with a single click.

---

## ✨ Features

- **🎯 Multi-Site Support**: Works with 4 major Russian job boards
- **📊 Smart Extraction**: Automatically detects and normalizes:
  - Role names (e.g., "Data Analyst", "ML Engineer")
  - Seniority levels (intern/junior/middle/senior)
  - Salary (converts to net RUB, handles USD/EUR)
  - Work mode (remote/hybrid/office)
  - Skills and tech stack
- **🧹 Clean Output**: Removes tracking parameters, deduplicates skills
- **📝 Obsidian-Ready**: YAML frontmatter + structured content
- **💾 Flexible Export**: Copy to clipboard or download as `.md` file
- **🚀 Zero Setup**: No API keys, no configuration needed

---

## 🚀 Installation

### Quick Install (5 minutes)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/bahrs/vacancy_parser_js.git
   cd vacancy_parser_js
   ```

2. **Load extension in Chrome (or any other Chrome-based browser)**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the extension folder
   - Done! 🎉

3. **Pin to toolbar** (optional but recommended)
   - Click the puzzle icon in Chrome toolbar
   - Find "Vacancy Parser (Obsidian)"
   - Click the pin icon

---

## 📖 Usage

### Basic Usage

1. Open any vacancy page on supported sites:
   - https://hh.ru/vacancy/XXXXXXXX
   - https://career.habr.com/vacancies/XXXXXXXX
   - https://geekjob.ru/vacancies/XXXXXXXX
   - https://superjob.ru/vakansii/XXXXXXXX

2. Click the extension icon in your toolbar

3. Click **"Parse This Page"**

4. Choose your export method:
   - **Copy Markdown**: Copies to clipboard → paste into Obsidian
   - **Download .md File**: Downloads with auto-generated filename

### Example Output

```markdown
---
type: application

company: "Yandex"
role: "Senior Data Analyst"
role_norm: "Data Analyst"
level: "senior"

source: "hh.ru"
job_link: "https://hh.ru/vacancy/123456"

work_mode: "hybrid"
location_address: "Москва, Лев Толстого 16"
location_metro: "Парк культуры"

salary: "от 200 000 ₽"
salary_min_net: "200000"
salary_currency: "RUB"

skills: ["Python", "SQL", "Tableau", "A/B testing"]
status: "want to apply"
---

## Snapshot
- **Company:** Yandex
- **Role:** Senior Data Analyst (senior)
- **Location:** Москва, Лев Толстого 16
- **Salary (min net):** 200000 RUB
...
```

---

## 🏗️ Architecture

### Project Structure

```
vacancy-parser-extension/
├── manifest.json           # Extension configuration
├── popup.html             # Extension popup UI
├── popup.js              # Popup logic & orchestration
├── content_loader.js     # Main content script orchestrator
│
├── lib/
│   ├── normalize.js      # Utility functions & normalization
│   └── template.js       # Template rendering engine
│
├── parsers/
│   ├── hh.js            # HH.ru parser
│   ├── habr.js          # Career.Habr parser
│   ├── geekjob.js       # GeekJob parser
│   └── superjob.js      # SuperJob parser
│
├── templates/
│   └── obsidian_vacancy.md   # Markdown template
│
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Data Flow

```
User clicks "Parse"
    ↓
popup.js sends message
    ↓
content_loader.js orchestrates:
    ├─→ Detect site (detectSource)
    ├─→ Call site parser (parseHH/parseHabr/etc)
    ├─→ Normalize data (normalizeRole, inferLevel)
    ├─→ Parse salary (parseSalaryMinNetAndCurrency)
    └─→ Return structured data
    ↓
popup.js renders template
    ↓
User copies/downloads Markdown
```

---

## 🎨 Supported Sites & Parsers

### 1. HH.ru ✅ **Fully Tested**
- **Stability**: 🟢 Excellent (uses `data-qa` attributes)
- **Extracted Fields**:
  - ✅ Role, Company, Salary
  - ✅ Location (city + metro)
  - ✅ Work mode, Experience
  - ✅ Skills, Full description
- **Special Features**: 
  - Custom location parser (handles complex address + metro structure)
  - Reliable selectors via `data-qa` attributes

### 2. Career.Habr.com ✅ **Working**
- **Stability**: 🟡 Good (class-based selectors)
- **Extracted Fields**:
  - ✅ Role, Company, Salary
  - ✅ Location, Work mode
  - ✅ Skills, Explicit level detection
  - ✅ Full description
- **Special Features**:
  - Detects explicit level from links (`qid=3/4/5` for Junior/Middle/Senior)
  - Handles "Не указана" salary

### 3. GeekJob.ru ⚠️ **Best Effort**
- **Stability**: 🟠 Challenging (dynamic content)
- **Extracted Fields**:
  - ✅ Role, Company, Salary
  - ⚠️ Location (limited)
  - ✅ Work mode (inferred), Skills
  - ✅ Full description
- **Note**: Tolerant parser with multiple fallbacks

### 4. SuperJob.ru ⚠️ **Best Effort**
- **Stability**: 🟠 Challenging (hashed classes)
- **Extracted Fields**:
  - ✅ Role, Company, Salary
  - ✅ Location (heuristic-based)
  - ✅ Metro (heuristic-based)
  - ✅ Work mode, Skills
  - ✅ Full description (cuts at "Похожие вакансии")
- **Special Features**:
  - Advanced location parser with heuristics
  - Escapes special characters in selectors (e.g., `+` in class names)

---

## 🧠 Smart Features

### Role Normalization
Converts varied role names to standard categories:
```javascript
"Дата-аналитик" → "Data Analyst"
"ML-инженер" → "ML Engineer"
"DWH разработчик" → "Data Engineer"
```

**Supported Roles**:
- Data Analyst
- Product Analyst
- BI Analyst
- Data Scientist
- ML Engineer
- Data Engineer

### Level Inference
Automatically detects seniority from:
- Role title keywords: "junior", "senior", "middle"
- Experience requirements: "от 1 года", "3-5 лет"
- Russian terms: "младший", "старший", "ведущий"
- Explicit level links (Habr.com)

**Output**: `intern`, `junior`, `junior+`, `middle`, `senior`

### Salary Normalization
- **Converts currencies**: USD/EUR → RUB (using approximate rates)
- **Gross to Net**: Converts "до вычета налогов" to "на руки" (×0.87)
- **Rounds**: To nearest 5,000 RUB for consistency
- **Example**: "200 000 - 300 000 руб." → `salary_min_net: "200000"`

### Work Mode Detection
Intelligently detects from text:
- **Remote**: "удалённо", "remote"
- **Hybrid**: "можно удалённо", "hybrid", "гибрид"
- **Office**: "офис", "office", "очно"

---

## 🛠️ Development

### Tech Stack
- **Manifest V3**: Latest Chrome extension API
- **Pure JavaScript**: No frameworks, zero dependencies
- **Content Scripts**: Injected into job site pages
- **Message Passing**: Popup ↔ Content script communication

### Adding a New Site

1. **Add URL pattern to `manifest.json`**:
   ```json
   "host_permissions": [
     "*://newsite.com/*"
   ]
   ```

2. **Create parser** in `parsers/newsite.js`:
   ```javascript
   function parseNewSite() {
     const role = pickText(["h1", ".job-title"]);
     const company = pickText([".company-name"]);
     // ... extract other fields
     
     return {
       role,
       company,
       salary,
       location_address,
       // ...
     };
   }
   ```

3. **Register parser** in `content_loader.js`:
   ```javascript
   function detectSource(hostname) {
     if (hostname.includes("newsite.com")) return "newsite";
     // ...
   }
   
   function parseBySource(source) {
     if (source === "newsite") return parseNewSite();
     // ...
   }
   ```

### Debugging

**View popup console**:
- Right-click extension icon → "Inspect popup"

**View content script console**:
- Open page (e.g., HH.ru vacancy)
- Press F12 → Console tab

**Test selectors**:
```javascript
// In page console
document.querySelector("YOUR_SELECTOR")?.innerText

// For lists
[...document.querySelectorAll("YOUR_SELECTOR")].map(e => e.innerText)
```

---

## 🔧 Troubleshooting

### "Could not establish connection"
**Cause**: Content script not loaded  
**Fix**: Refresh the vacancy page after loading the extension

### "Please open a vacancy page"
**Cause**: Wrong URL  
**Fix**: Make sure you're on a vacancy detail page (not search results)

### Empty fields in output
**Cause**: Site changed HTML structure  
**Fix**: 
1. Open DevTools (F12) on the page
2. Find the element you want
3. Right-click → Copy → Copy selector
4. Update the parser in `parsers/*.js`

### Extension not appearing
**Cause**: Not loaded properly  
**Fix**:
1. Go to `chrome://extensions/`
2. Remove and reload the extension
3. Check for errors in the extension card

---

## 📝 Customization

### Modify Template
Edit `templates/obsidian_vacancy.md` to change:
- YAML frontmatter fields
- Markdown structure
- Default values

### Change Filename Format
Edit `buildFilename()` in `popup.js`:
```javascript
function buildFilename(v) {
  const date = new Date().toISOString().slice(0, 10);
  // Customize format here
  return `${date}_${v.company}_${v.role}.md`;
}
```

### Add Custom Fields
1. Extract in parser: `const myField = pickText([".my-selector"])`
2. Return in parser: `return { ..., myField }`
3. Add to template: `my_field: "{{myField}}"`

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:

### High Priority
- [ ] Better SuperJob.ru selector stability
- [ ] GeekJob.ru location extraction
- [ ] Unit tests for parsers
- [ ] Error recovery for failed extractions

### Nice to Have
- [ ] More job sites (Zarplata.ru, Rabota.ru, etc.)
- [ ] LinkedIn support (challenging due to auth)
- [ ] Multiple template options
- [ ] Batch parsing (save multiple vacancies)

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Test on all 4 supported sites
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- Inspired by the need for structured job application tracking
- Built for the Obsidian note-taking community
- Thanks to all contributors and testers

---


**Happy job hunting! 🎯**