const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');
const { minify: minifyHtml } = require('html-minifier-terser');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const BASE_URL = 'https://romanagency.net';

const LANG_MAP = {
  zh: 'zh-CN',
  ru: 'ru',
};

const META = {
  zh: {
    title: 'Roman Agency Marketing — Facebook 和 TikTok 优质广告账户租赁',
    description: 'Roman Agency Marketing 专注于出租 Facebook 和 TikTok 广告账户。24/7 全天候支持、免费更换、透明消费报告。$100 起步。',
    ogTitle: 'Roman Agency Marketing — Facebook 和 TikTok 广告账户租赁',
    ogDescription: 'Facebook 和 TikTok 优质广告账户租赁。24/7 支持、免费更换、透明政策。$100 起步。',
    twitterTitle: 'Roman Agency Marketing — Facebook 和 TikTok 广告账户租赁',
    twitterDescription: 'Facebook 和 TikTok 优质广告账户租赁。24/7 支持、免费更换、透明政策。',
  },
  ru: {
    title: 'Roman Agency Marketing — Аренда рекламных аккаунтов Facebook и TikTok',
    description: 'Roman Agency Marketing — аренда рекламных аккаунтов Facebook и TikTok. Поддержка 24/7, бесплатная замена, прозрачные отчёты. Депозит от $100.',
    ogTitle: 'Roman Agency Marketing — Аренда рекламных аккаунтов Facebook и TikTok',
    ogDescription: 'Премиальная аренда рекламных аккаунтов Facebook и TikTok. Поддержка 24/7, бесплатная замена, прозрачная политика. Депозит от $100.',
    twitterTitle: 'Roman Agency Marketing — Аренда рекламных аккаунтов Facebook и TikTok',
    twitterDescription: 'Премиальная аренда рекламных аккаунтов Facebook и TikTok. Поддержка 24/7, бесплатная замена, прозрачная политика.',
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function loadTranslations() {
  const i18nRaw = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf-8');
  const objSource = i18nRaw.replace(/^\s*const\s+translations\s*=\s*/, '').replace(/;\s*$/, '');
  return new Function(`return (${objSource})`)();
}

function getHreflangBlock() {
  return [
    `<link rel="alternate" hreflang="en" href="${BASE_URL}/" />`,
    `<link rel="alternate" hreflang="zh" href="${BASE_URL}/zh/" />`,
    `<link rel="alternate" hreflang="ru" href="${BASE_URL}/ru/" />`,
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`,
  ].join('\n    ');
}

function buildSwitcher(activeLang, hrefs) {
  const langs = [
    { code: 'en', label: 'English', display: 'EN', href: hrefs.en },
    { code: 'zh', label: '中文', display: 'ZH', href: hrefs.zh },
    { code: 'ru', label: 'Русский', display: 'RU', href: hrefs.ru },
  ];
  const active = langs.find(l => l.code === activeLang);
  const menuItems = langs.map(l => {
    const cls = l.code === activeLang ? ' class="is-active"' : '';
    return `            <a href="${l.href}" data-lang="${l.code}"${cls}>${l.label}</a>`;
  }).join('\n');

  return `        <div class="lang-switcher" id="lang-switcher">\n          <button class="lang-switcher__btn" type="button" aria-label="Change language">\n            <span id="lang-current">${active.display}</span>\n            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>\n          </button>\n          <div class="lang-switcher__menu" id="lang-menu">\n${menuItems}\n          </div>\n        </div>`;
}

function replaceSwitcher(html, lang, hrefs) {
  const startMarker = '<div class="lang-switcher" id="lang-switcher">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return html;

  let lineStart = startIdx;
  while (lineStart > 0 && html[lineStart - 1] !== '\n') lineStart--;

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
        endIdx = i + 6;
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }

  if (endIdx === -1) return html;
  return html.substring(0, lineStart) + buildSwitcher(lang, hrefs) + html.substring(endIdx);
}

function replaceI18nContent(html, langData) {
  return html.replace(
    /(data-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/(?:span|a|p|h[1-6]|li|div|strong|label|button)>)/g,
    (match, prefix, key, _oldContent, closingTag) => {
      if (langData[key] !== undefined) {
        let newContent = langData[key];
        if (key === 'footer.ctaNote') {
          newContent = `<span class="status-dot"></span> ${newContent}`;
        }
        return `${prefix}${newContent}${closingTag}`;
      }
      return match;
    }
  );
}

function replaceMetaTags(html, meta, lang) {
  html = html.replace(/(<title>)([\s\S]*?)(<\/title>)/, (m, p1, p2, p3) => p1 + meta.title + p3);
  html = html.replace(/(<meta\s+name="description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.description + p3);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.ogTitle + p3);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.ogDescription + p3);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + BASE_URL + '/' + lang + '/' + p3);
  html = html.replace(/(<meta\s+name="twitter:title"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.twitterTitle + p3);
  html = html.replace(/(<meta\s+name="twitter:description"\s+content=")([\s\S]*?)("\s*\/\s*>)/, (m, p1, p2, p3) => p1 + meta.twitterDescription + p3);
  return html;
}

function addHreflangTags(html) {
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  return html.replace(/(\s*)<\/head>/, `\n    ${getHreflangBlock()}\n  </head>`);
}

function replaceLangAttr(html, htmlLang) {
  return html.replace(/<html lang="en">/, `<html lang="${htmlLang}">`);
}

function fixAssetPathsForLocalized(html) {
  html = html.replace(/(?:"\.\/)(?=assets\/|styles\.css|script\.js)/g, '"../');
  html = html.replace(/(?:'\.\/)(?=assets\/|styles\.css|script\.js)/g, "'../");
  return html;
}

async function minifyHtmlFileContent(html) {
  return minifyHtml(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: false,
    removeStyleLinkTypeAttributes: false,
    useShortDoctype: true,
    minifyCSS: false,
    minifyJS: false,
    keepClosingSlash: true,
  });
}

async function main() {
  const translations = loadTranslations();
  const sourceHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  const sourceCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf-8');
  const sourceJs = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf-8');

  cleanDir(DIST);

  // Copy assets first
  if (fs.existsSync(path.join(ROOT, 'assets'))) copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
  if (fs.existsSync(path.join(ROOT, 'assets-2x'))) copyDir(path.join(ROOT, 'assets-2x'), path.join(DIST, 'assets-2x'));

  // Minify CSS + JS once
  const minifiedCss = new CleanCSS({ level: 2 }).minify(sourceCss).styles;
  const minifiedJsResult = await minify(sourceJs, {
    compress: true,
    mangle: true,
    sourceMap: false,
    format: { comments: false },
  });

  fs.writeFileSync(path.join(DIST, 'styles.css'), minifiedCss, 'utf-8');
  fs.writeFileSync(path.join(DIST, 'script.js'), minifiedJsResult.code, 'utf-8');

  // English
  let enHtml = sourceHtml;
  enHtml = addHreflangTags(enHtml);
  enHtml = replaceSwitcher(enHtml, 'en', { en: '/', zh: '/zh/', ru: '/ru/' });
  enHtml = await minifyHtmlFileContent(enHtml);
  fs.writeFileSync(path.join(DIST, 'index.html'), enHtml, 'utf-8');

  // Localized pages
  for (const lang of Object.keys(LANG_MAP)) {
    let html = sourceHtml;
    html = replaceLangAttr(html, LANG_MAP[lang]);
    html = replaceMetaTags(html, META[lang], lang);
    html = replaceI18nContent(html, translations[lang]);
    html = addHreflangTags(html);
    html = replaceSwitcher(html, lang, { en: '/', zh: '/zh/', ru: '/ru/' });
    html = fixAssetPathsForLocalized(html);
    html = await minifyHtmlFileContent(html);

    const outDir = path.join(DIST, lang);
    ensureDir(outDir);
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  }

  console.log('build-prod: Done');
  console.log('Output:');
  console.log('  dist/index.html');
  console.log('  dist/styles.css');
  console.log('  dist/script.js');
  console.log('  dist/zh/index.html');
  console.log('  dist/ru/index.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
