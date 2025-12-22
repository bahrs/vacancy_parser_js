# Vacancy Parser Browser Extension

One-click parser for HH.ru job vacancies → Obsidian Markdown

## 🚀 Quick Start (5 minutes)

### Step 1: Create Extension Folder

```
vacancy_parser_extension/
├── manifest.json
├── content.js
├── popup.html
├── popup.js
├── icon16.png
├── icon48.png
└── icon128.png
```

### Step 2: Add Icons

**Quick solution**: Download any 3 PNG files and rename them to `icon16.png`, `icon48.png`, `icon128.png`

**Or use this online tool**: https://www.favicon-generator.org/
- Upload any image
- Download the icon pack
- Rename files to match above

**Or use placeholders**: Create colored squares in Paint (16x16, 48x48, 128x128 pixels)

### Step 3: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select your `vacancy_parser_extension` folder
5. Done! You should see the extension icon in your toolbar

### Step 4: Test It!

1. Go to any HH.ru vacancy page (e.g., https://hh.ru/vacancy/128081806)
2. Click the extension icon
3. Click **Parse This Page**
4. Click **Copy Markdown** or **Download .md File**
5. Paste into your Obsidian vault!

## 📋 What It Extracts

- ✅ Role/Position title
- ✅ Company name
- ✅ Salary (detects "на руки")
- ✅ Location (city + metro)
- ✅ Work mode (remote/hybrid/office)
- ✅ Key skills
- ✅ Full job description
- ✅ Auto-classifies position type (Data Analyst/Scientist/Engineer/etc.)
- ✅ Auto-detects level (intern/junior/middle/senior)

## 🔧 Troubleshooting

**"Error: Could not establish connection"**
- Refresh the HH.ru page after loading the extension
- Extension only works on `hh.ru` domains

**"Please open an HH.ru vacancy page"**
- Make sure you're on a vacancy page (URL contains `/vacancy/`)

**Some fields are empty**
- HH.ru changed their HTML structure
- Open DevTools (F12) and find the correct CSS selector
- Update `content.js` with new selectors

## 🎯 Next Steps

**To add more sites:**
1. Add URL pattern to `manifest.json` (e.g., `"*://*.habr.com/*"`)
2. Create site-specific parsing logic in `content.js`
3. Detect site by URL and choose appropriate parser

**To customize template:**
- Edit the `formatMarkdown()` function in `popup.js`
- Change YAML frontmatter structure
- Add/remove fields as needed

**To auto-open in Obsidian:**
- Use Obsidian URI scheme: `obsidian://new?vault=YourVault&name=filename`
- Add button in popup.html that opens this URL

## 📝 Files Overview

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `content_loader.js` | Runs on job sites, orchestrates parsing + normalization |
| `parsers/*.js` | Site-specific DOM extraction (CSS selectors) |
| `lib/normalize.js` | Common normalization (role names, levels, salary, work mode) |
| `lib/template.js` | Template rendering engine ({{variable}} replacement) |
| `popup.html` | UI when you click extension icon |
| `popup.js` | Orchestrates parsing, handles UI, sends messages to content script |
| `templates/obsidian_vacancy.md` | Markdown template with YAML frontmatter |

## 🔄 Data Flow & Architecture

### Overview
A Chrome extension that extracts job vacancy data from Russian job sites (hh.ru, career.habr.com, geekjob.ru, superjob.ru) and converts it to Obsidian Markdown format.

### Data Flow (Step by Step)

#### 1. Extension Initialization (`manifest.json`)
When the extension loads:
- Content scripts are injected into job sites automatically
- Scripts load in order:
  1. `lib/normalize.js` - utility functions
  2. `parsers/hh.js`, `parsers/habr.js`, etc. - site-specific parsers
  3. `content_loader.js` - main orchestrator

#### 2. User Interaction (`popup.html` + `popup.js`)
```
User clicks extension icon
    ↓
Popup opens (popup.html)
    ↓
User clicks "Parse This Page" button
    ↓
popup.js sends message to content script
```

#### 3. Content Script Execution (`content_loader.js`)
When `popup.js` sends `{ action: "parseVacancy" }`:

```javascript
// Step 1: Detect which site we're on
const source = detectSource(location.hostname);
// Returns: "hh.ru", "career.habr", "geekjob", "superjob", or "other"

// Step 2: Call site-specific parser
const partial = parseBySource(source);
// Calls parseHH(), parseHabr(), parseGeekjob(), etc.
```

#### 4. Site-Specific Parsing (`parsers/*.js`)
Each parser extracts raw data from DOM:

```javascript
// Example: parsers/hh.js
function parseHH() {
    const role = pickText(['[data-qa="vacancy-title"]', "h1"]);
    const company = pickText(['[data-qa="vacancy-company-name"]']);
    const salary = pickText(['[data-qa="vacancy-salary"]']);
    // ... more fields
    
    return {
        role,           // Raw text: "Senior Data Analyst"
        company,        // Raw text: "Yandex"
        salary,         // Raw text: "200 000 - 300 000 руб. на руки"
        skills: [...],  // Array of strings
        // ...
    };
}
```

Returns a **partial object** with raw, unprocessed data.

#### 5. Normalization (`lib/normalize.js`)
The raw data is normalized:

```javascript
// In content_loader.js after parsing:

// Normalize role name
const role_norm = normalizeRole(role);
// "Senior Data Analyst" → "Data Analyst"

// Infer level
const level = inferLevel(role, rawText);
// Analyzes text → "junior", "middle", "senior", etc.

// Parse and normalize salary
const { salary_min_net, salary_currency } = parseSalaryMinNetAndCurrency(salary);
// "200 000 - 300 000 руб. на руки" → { salary_min_net: "200000", salary_currency: "RUB" }
// Converts USD/EUR to RUB, gross to net, rounds to 5000

// Infer work mode
const work_mode = inferWorkMode(rawText);
// "удаленно" → "remote"

// Clean and dedupe skills
const skills = dedupeArray(skills.map(cleanText));
```

#### 6. Final Data Assembly (`content_loader.js`)
All normalized data is combined:

```javascript
const data = {
    company: cleanText(partial.company),
    role,                    // Original: "Senior Data Analyst"
    role_norm,              // Normalized: "Data Analyst"
    level,                   // Inferred: "senior"
    source,                  // "hh.ru"
    job_link,                // Cleaned URL (tracking params removed)
    work_mode,               // "remote"
    location_city,           // "Москва"
    location_metro,          // "Деловой центр"
    salary_min_net,         // "200000"
    salary_currency,         // "RUB"
    skills,                  // ["Python", "SQL", ...]
    job_description_raw,    // Full text
    // ...
};
```

#### 7. Template Rendering (`lib/template.js` + `popup.js`)
```javascript
// popup.js loads template
const templateText = await loadExtensionTextFile("templates/obsidian_vacancy.md");

// Render template with data
const markdown = renderTemplate(templateText, vacancy);
// Replaces {{company}} → "Yandex", {{role}} → "Senior Data Analyst", etc.
```

#### 8. Output (`popup.js`)
User can:
- **Copy Markdown** to clipboard
- **Download** as `.md` file (auto-named: `2024-01-15_yandex_data_analyst.md`)

### Communication Pattern

```
┌─────────────┐
│  popup.js   │  (Extension popup - separate context)
└──────┬──────┘
       │ chrome.tabs.sendMessage()
       │ { action: "parseVacancy" }
       ↓
┌──────────────────┐
│ content_loader.js │  (Runs on job site page)
│ (injected into   │
│  page context)   │
└──────┬───────────┘
       │
       ├─→ detectSource() → "hh.ru"
       ├─→ parseBySource() → parseHH()
       ├─→ normalizeRole()
       ├─→ inferLevel()
       ├─→ parseSalaryMinNetAndCurrency()
       └─→ sendResponse({ data })
       │
       ↑
       │ { ok: true, data: {...} }
       │
┌──────┴──────┐
│  popup.js   │
└─────────────┘
```

### Design Patterns

1. **Separation of Concerns:**
   - **Parsers** = extraction (site-specific)
   - **Normalizers** = processing (domain-specific)
   - **Template** = presentation (format-specific)

2. **Fallback Chain:**
   - Each parser uses multiple CSS selectors: `pickText(['selector1', 'selector2', 'fallback'])`
   - If site-specific parser fails → `parseGeneric()` fallback

3. **Message Passing:**
   - Popup ↔ Content script via `chrome.tabs.sendMessage()`
   - Async/await pattern for handling responses

4. **Script Injection:**
   - If content script not loaded → `ensureContentScript()` injects it dynamically
   - Handles page refreshes gracefully

### Example Flow

1. User visits: `https://hh.ru/vacancy/123456`
2. Clicks extension icon → popup opens
3. Clicks "Parse This Page"
4. `popup.js` sends message to `content_loader.js`
5. `content_loader.js` detects "hh.ru" → calls `parseHH()`
6. `parseHH()` extracts: `role: "Senior Data Analyst"`, `salary: "200 000 руб. на руки"`
7. Normalization:
   - `normalizeRole()` → `role_norm: "Data Analyst"`
   - `inferLevel()` → `level: "senior"`
   - `parseSalaryMinNetAndCurrency()` → `salary_min_net: "200000"`
8. Data assembled into final object
9. Template rendered → Markdown string
10. User copies/downloads the Markdown file

This architecture keeps parsing, normalization, and presentation separate, making it easy to add new sites or change output formats.

## 💡 Pro Tips

- Pin the extension to toolbar for quick access
- Set up keyboard shortcut in `chrome://extensions/shortcuts`
- For debugging: Right-click extension icon → Inspect popup


**Ready to test? Load it up and parse your first vacancy! 🎉**





# How to add / monitor DOM fields yourself (beginner-friendly)

### 1) Open DevTools on the vacancy page
- Press **F12** (or Right click → **Inspect**)
- Go to **Elements** tab

### 2) “Pick” the element you want (role/company/salary/etc.)
- Click the **arrow icon** (top-left in DevTools)
- Click the element on the page (e.g., the company name)

### 3) Copy a CSS selector
- In **Elements**, right-click the highlighted node → **Copy → Copy selector**
- Now you have a CSS selector string.

### 4) Test the selector in Console (super important)
Go to **Console** tab and run:

```js
document.querySelector("PASTE_SELECTOR_HERE")?.innerText
```
for lists (skills, tags) use
```js
[...document.querySelectorAll("PASTE_SELECTOR_HERE")].map(e => e.innerText.trim())
```

### 5) Add it to a parser file

Example: you found a selector for salary. Put it into pickText([...]):
```js
const salary = pickText([
  "your-new-salary-selector",
  "your-fallback-selector",
  ".salary"
]);
```
