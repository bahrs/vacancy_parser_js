async function loadExtensionTextFile(relPath) {
    const url = chrome.runtime.getURL(relPath);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${relPath}: ${res.status}`);
    return await res.text();
  }
  
  function renderTemplate(template, data) {
    const d = Object.assign(
      {
        company: "",
        role: "",
        role_norm: "",
        level: "",
        source: "",
        job_link: "",
        work_mode: "",
        location_city: "",
        location_metro: "",
        location_display: "",
        commute_minutes: "",
        salary: "",
        salary_min_net: "",
        salary_currency: "",
        stack: [],
        skills: [],
        tags: [],
        job_description_raw: "",
        cover_letter_draft: "",
        apply_date: ""
      },
      data || {}
    );
  
    // derived placeholders for YAML arrays
    d.stack_yaml = toYamlInlineArray(d.stack || []);
    d.skills_yaml = toYamlInlineArray(d.skills || []);
    d.tags_yaml = toYamlInlineArray(d.tags || []);
  
    // safety: always strip tracking on render too
    d.job_link = stripTrackingParams(d.job_link || "");
  
    // replace {{var}}
    return (template || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_m, key) => {
      const v = d[key];
      if (v === null || v === undefined) return "";
      return String(v);
    });
  }  