
const ardupilotResponse = {
  "task_id": "crawl_43bf5744",
  "status": "completed",
  "result": {
    "success": true,
    "results": [
      {
        "url": "https://ardupilot.org/",
        "html": "<html>...</html>",
        "fit_html": "ArduPilot is a trusted, versatile, and open source autopilot system supporting many vehicle types: multi-copters, traditional helicopters, fixed wing aircraft, boats, submarines, rovers and more.",
        "success": true,
        "cleaned_html": "<html><body>ArduPilot is a trusted, versatile, and open source autopilot system supporting many vehicle types: multi-copters, traditional helicopters, fixed wing aircraft, boats, submarines, rovers and more. ArduPilot is a trusted, versatile, and open source autopilot system supporting many vehicle types: multi-copters, traditional helicopters, fixed wing aircraft, boats, submarines, rovers and more.</body></html>",
        "markdown": null,
        "metadata": { "title": "ArduPilot" }
      }
    ]
  }
};

const mapping = {
  "Communities": { id: "797274bf-0f09-4bb0-90ab-2ff582577f33", key: "dataset-SkfN0ZqcLwNBaJPiTp46MHP7" }
};

const items = [{ json: { ...ardupilotResponse, Tag: "Communities", Seed_URL: "https://ardupilot.org/" } }];
const results = [];
const debugLog = [];

for (const item of items) {
  const tag = item.json.Tag || 'Communities';
  const dataset = mapping[tag] || mapping['Communities'];
  
  let pages = [];
  if (item.json.result && Array.isArray(item.json.result.results)) {
    pages = item.json.result.results;
  } else if (Array.isArray(item.json.results)) {
    pages = item.json.results;
  } else if (item.json.result && item.json.result.html) {
    pages = [item.json.result];
  } else if (item.json.html || item.json.markdown) {
    pages = [item.json];
  }

  console.log(`Found ${pages.length} pages`);

  for (const p of pages) {
    if (p.success === false) {
      debugLog.push({ url: p.url, reason: "Success flag false" });
      continue;
    }

    let rawContent = p.markdown || p.cleaned_html || p.fit_html || p.html || "";
    if (typeof rawContent !== 'string') rawContent = "";

    if (rawContent.includes("<property object") || rawContent.includes("<crawler")) {
      debugLog.push({ url: p.url, reason: "Python object detected" });
      continue;
    }

    let cleanText = rawContent;
    if (!p.markdown && (p.cleaned_html || p.html)) {
      // Basic tag removal
      cleanText = rawContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    }

    if (cleanText.length < 150) {
      debugLog.push({ url: p.url, reason: "Content too short", length: cleanText.length });
      continue;
    }

    results.push({
      json: {
        _title: p.metadata?.title || "Manual",
        _markdown: cleanText.substring(0, 100) + "...",
        dataset_id: dataset.id
      }
    });
  }
}

console.log("Results:", JSON.stringify(results, null, 2));
console.log("Debug Log:", JSON.stringify(debugLog, null, 2));
