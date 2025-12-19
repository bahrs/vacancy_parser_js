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
| `content.js` | Runs on HH.ru pages, extracts data from DOM |
| `popup.html` | UI when you click extension icon |
| `popup.js` | Formats data → markdown, handles copy/download |

## 💡 Pro Tips

- Pin the extension to toolbar for quick access
- Set up keyboard shortcut in `chrome://extensions/shortcuts`
- For debugging: Right-click extension icon → Inspect popup

---

**Ready to test? Load it up and parse your first vacancy! 🎉**