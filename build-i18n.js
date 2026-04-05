/**
 * build-i18n.js
 * Generates static HTML pages for Chinese (zh) and Russian (ru)
 * from the English index.html, and updates the English page in-place
 * with hreflang tags and static language switcher links.
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ───────────────────────────────────────────────────
const ROOT = __dirname;
const HTML_PATH = path.join(ROOT, 'index.html');
const I18N_PATH = path.join(ROOT, 'i18n.js');
const BASE_URL = 'https://romanagency.net';

const LANG_MAP = {
  zh: 'zh-CN',
  ru: 'ru',
};

const META = {
  zh: {
    title: 'Roman Agency Marketing \u2014 Facebook \u548c TikTok \u4f18\u8d28\u5e7f\u544a\u8d26\u6237\u79df\u8d41',
    description: 'Roman Agency Marketing \u4e13\u6ce8\u4e8e\u51fa\u79df Facebook \u548c TikTok \u5e7f\u544a\u8d26\u6237\u300224/7 \u5168\u5929\u5019\u652f\u6301\u3001\u514d\u8d39\u66f4\u6362\u3001\u900f\u660e\u6d88\u8d39\u62a5\u544a\u3002$100 \u8d77\u6b65\u3002',
    ogTitle: 'Roman Agency Marketing \u2014 Facebook \u548c TikTok \u5e7f\u544a\u8d26\u6237\u79df\u8d41',
    ogDescription: 'Facebook \u548c TikTok \u4f18\u8d28\u5e7f\u544a\u8d26\u6237\u79df\u8d41\u300224/7 \u652f\u6301\u3001\u514d\u8d39\u66f4\u6362\u3001\u900f\u660e\u653f\u7b56\u3002$100 \u8d77\u6b65\u3002',
    twitterTitle: 'Roman Agency Marketing \u2014 Facebook \u548c TikTok \u5e7f\u544a\u8d26\u6237\u79df\u8d41',
    twitterDescription: 'Facebook \u548c TikTok \u4f18\u8d28\u5e7f\u544a\u8d26\u6237\u79df\u8d41\u300224/7 \u652f\u6301\u3001\u514d\u8d39\u66f4\u6362\u3001\u900f\u660e\u653f\u7b56\u3002',
  },
  ru: {
    title: 'Roman Agency Marketing \u2014 \u0410\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok',
    description: 'Roman Agency Marketing \u2014 \u0430\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 24/7, \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f \u0437\u0430\u043c\u0435\u043d\u0430, \u043f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u044b\u0435 \u043e\u0442\u0447\u0451\u0442\u044b. \u0414\u0435\u043f\u043e\u0437\u0438\u0442 \u043e\u0442 $100.',
    ogTitle: 'Roman Agency Marketing \u2014 \u0410\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok',
    ogDescription: '\u041f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d\u0430\u044f \u0430\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 24/7, \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f \u0437\u0430\u043c\u0435\u043d\u0430, \u043f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u0430\u044f \u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0430. \u0414\u0435\u043f\u043e\u0437\u0438\u0442 \u043e\u0442 $100.',
    twitterTitle: 'Roman Agency Marketing \u2014 \u0410\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok',
    twitterDescription: '\u041f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d\u0430\u044f \u0430\u0440\u0435\u043d\u0434\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u0432 Facebook \u0438 TikTok. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 24/7, \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f \u0437\u0430\u043c\u0435\u043d\u0430, \u043f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u0430\u044f \u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0430.',
  },
};

// ── Load translations ───────────────────────────────────────────────
const i18nRaw = fs.readFileSync(I18N_PATH, 'utf-8');
// Strip `const translations = ` and trailing semicolons/whitespace, then evaluate
const objSource = i18nRaw.replace(/^\s*const\s+translations\s*=\s*/, '').replace(/;\s*$/, '');
const translations = new Function(`return (${objSource})`)();

// ── Load English HTML ───────────────────────────────────────────────
const htmlSource = fs.readFileSync(HTML_PATH, 'utf-8');

// ── Hreflang block ──────────────────────────────────────────────────
const hreflangBlock = [
  `<link rel="alternate" hreflang="en" href="${BASE_URL}/" />`,
  `<link rel="alternate" hreflang="zh" href="${BASE_URL}/zh/" />`,
  `<link rel="alternate" hreflang="ru" href="${BASE_URL}/ru/" />`,
  `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`,
].join('\n    ');

// ── Language switcher builders ──────────────────────────────────────
function buildSwitcher(activeLang) {
  const langs = [
    { code: 'en', label: 'English', display: 'EN', href: '/' },
    { code: 'zh', label: '\u4e2d\u6587', display: 'ZH', href: '/zh/' },
    { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', display: 'RU', href: '/ru/' },
  ];

  const active = langs.find(l => l.code === activeLang);
  const menuItems = langs.map(l => {
    const cls = l.code === activeLang ? ' class="is-active"' : '';
    return `            <a href="${l.href}" data-lang="${l.code}"${cls}>${l.label}</a>`;
  }).join('\n');

  return `        <div class="lang-switcher" id="lang-switcher">
          <button class="lang-switcher__btn" type="button" aria-label="Change language">
            <span id="lang-current">${active.display}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="lang-switcher__menu" id="lang-menu">
${menuItems}
          </div>
        </div>`;
}

// ── Replace language switcher using string search ───────────────────
function replaceSwitcher(html, lang) {
  const startMarker = '<div class="lang-switcher" id="lang-switcher">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return html;

  // Find the line start (go back to find leading whitespace)
  let lineStart = startIdx;
  while (lineStart > 0 && html[lineStart - 1] !== '\n') lineStart--;

  // Count nested divs to find the correct closing </div>
  let depth = 0;
  let i = startIdx;
  let endIdx = -1;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth++;
      i += 4;
    } else if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) {
        endIdx = i + 6; // past </div>
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }

  if (endIdx === -1) return html;

  const newSwitcher = buildSwitcher(lang);
  return html.substring(0, lineStart) + newSwitcher + html.substring(endIdx);
}
function replaceI18nContent(html, langData) {
  // Match: data-i18n="key">...content...</closingTag>
  // Handles both single-line and multi-line content.
  return html.replace(
    /(data-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/(?:span|a|p|h[1-6]|li|div|strong|label|button)>)/g,
    (match, prefix, key, _oldContent, closingTag) => {
      if (langData[key] !== undefined) {
        let newContent = langData[key];

        // Special: footer.ctaNote - preserve status-dot span
        if (key === "footer.ctaNote") {
          newContent = `<span class="status-dot"></span> ${newContent}`;
        }

        return `${prefix}${newContent}${closingTag}`;
      }
      return match;
    }
  );
}

// ── Fix relative asset paths for subdirectory pages ─────────────────
function fixAssetPaths(html) {
  // Replace ./assets/, ./styles.css, ./script.js, ./i18n.js with ../
  html = html.replace(/(?:"\.\/)(?=assets\/|styles\.css|script\.js|i18n\.js)/g, '"../');
  // Also handle src="./assets/..." without quotes change (single quotes if any)
  html = html.replace(/(?:'\.\/)(?=assets\/|styles\.css|script\.js|i18n\.js)/g, "'../");
  return html;
}

// ── Replace meta tags ───────────────────────────────────────────────
function replaceMetaTags(html, meta, lang) {
  // Helper to safely replace without backreference issues ($1, $100, etc.)
  function safeReplace(html, regex, replacerFn) {
    return html.replace(regex, replacerFn);
  }

  // Title
  html = safeReplace(html, /(<title>)([\s\S]*?)(<\/title>)/, (m, p1, p2, p3) => p1 + meta.title + p3);

  // meta description (multi-line)
  html = safeReplace(html, /(<meta\s+name="description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.description + p3);

  // og:title
  html = safeReplace(html, /(<meta\s+property="og:title"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.ogTitle + p3);

  // og:description
  html = safeReplace(html, /(<meta\s+property="og:description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.ogDescription + p3);

  // og:url
  html = safeReplace(html, /(<meta\s+property="og:url"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + BASE_URL + '/' + lang + '/' + p3);

  // twitter:title
  html = safeReplace(html, /(<meta\s+name="twitter:title"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.twitterTitle + p3);

  // twitter:description
  html = safeReplace(html, /(<meta\s+name="twitter:description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.twitterDescription + p3);

  return html;
}

// ── Add hreflang tags into <head> ───────────────────────────────────
function addHreflangTags(html) {
  // Remove any existing hreflang tags first
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  // Insert before </head>
  return html.replace(
    /(\s*)<\/head>/,
    `\n    ${hreflangBlock}\n  </head>`
  );
}

// ── Replace lang attribute ──────────────────────────────────────────
function replaceLangAttr(html, htmlLang) {
  return html.replace(/<html lang="en">/, `<html lang="${htmlLang}">`);
}

// ════════════════════════════════════════════════════════════════════
//  MAIN BUILD
// ════════════════════════════════════════════════════════════════════

console.log('build-i18n: Starting...\n');

// ── 1. Generate localized pages (zh, ru) ────────────────────────────
for (const lang of Object.keys(LANG_MAP)) {
  console.log(`  Building ${lang}/index.html ...`);

  let html = htmlSource;

  // a. Replace lang attribute
  html = replaceLangAttr(html, LANG_MAP[lang]);

  // b. Replace meta tags
  html = replaceMetaTags(html, META[lang], lang);

  // c. Replace data-i18n content
  html = replaceI18nContent(html, translations[lang]);

  // d. Fix asset paths for subdirectory
  html = fixAssetPaths(html);

  // e. Add hreflang tags
  html = addHreflangTags(html);

  // f. Replace language switcher with <a> links
  html = replaceSwitcher(html, lang);

  // g. Write output
  const outDir = path.join(ROOT, lang);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`  \u2713 Written to ${lang}/index.html`);
}

// ── 2. Update English index.html in-place ───────────────────────────
console.log('\n  Updating English index.html ...');

let enHtml = htmlSource;

// a. Add hreflang tags
enHtml = addHreflangTags(enHtml);

// b. Replace language switcher with <a> links
enHtml = replaceSwitcher(enHtml, 'en');

fs.writeFileSync(HTML_PATH, enHtml, 'utf-8');
console.log('  \u2713 English index.html updated\n');

console.log('build-i18n: Done! Generated:');
console.log(`  - ${path.relative(ROOT, path.join(ROOT, 'zh', 'index.html'))}`);
console.log(`  - ${path.relative(ROOT, path.join(ROOT, 'ru', 'index.html'))}`);
console.log(`  - index.html (updated in-place)`);
