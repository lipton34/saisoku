import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const TARGET_PAGES = [
  "https://granbluefantasy.com/ja/news/",
  "https://granbluefantasy.com/ja/news/category/",
  "https://granbluefantasy.com/ja/news/category/?p=update",
  "https://granbluefantasy.com/ja/news/archive/?p=20265",
  "https://granbluefantasy.com/ja/news/archive/?p=20264",
  "https://granbluefantasy.com/ja/news/9690/",
];

const SITE_ORIGIN = "https://granbluefantasy.com";
const FALLBACK_API_BASE = "https://granbluefantasy.com/rcms-api";
const FALLBACK_API_ID = "1";
const USER_AGENT =
  "saisoku-news-api-investigation/0.1 (+internal pre-implementation reachability check)";
const SEARCH_TERMS = ["news", "archive", "category", "api", "rcms-api"];
const PERIOD_PATTERNS = [
  /開催期間[:：]?\s*[^。\n]{0,140}/g,
  /実施期間[:：]?\s*[^。\n]{0,140}/g,
  /期間[:：]?\s*[^。\n]{0,140}/g,
  /\d{4}\/\d{1,2}\/\d{1,2}[^。\n]{0,120}(?:～|~|から|より)[^。\n]{0,120}/g,
  /\d{4}年\d{1,2}月\d{1,2}日[^。\n]{0,120}(?:～|~|から|より)[^。\n]{0,120}/g,
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "docs", "news_api_investigation.md");
const execFileAsync = promisify(execFile);

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]*>/g, " ");
}

function normalizeSnippet(value, maxLength = 180) {
  const normalized = decodeBasicEntities(stripTags(String(value))).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function markdownList(values, emptyText = "なし") {
  if (!values?.length) return emptyText;
  return values.map((value) => `  - ${String(value).replace(/\n/g, " ")}`).join("\n");
}

function yesNo(value) {
  return value ? "あり" : "なし";
}

function buildUrl(base, params = {}) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function fetchText(url, accept = "*/*") {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      accept,
      "accept-language": "ja,en-US;q=0.8,en;q=0.6",
    },
  });
  return {
    url,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
}

async function fetchJsonSummary(name, url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json",
        "accept-language": "ja,en-US;q=0.8,en;q=0.6",
      },
    });
    const text = await response.text();
    let json = null;
    let parseError = "";
    try {
      json = JSON.parse(text);
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
    return summarizeApiResponse({
      name,
      url,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      sizeBytes: Buffer.byteLength(text, "utf8"),
      json,
      parseError,
    });
  } catch (error) {
    return {
      name,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeApiResponse(base) {
  if (!base.json) return base;

  const rootKeys = Object.keys(base.json);
  const list = Array.isArray(base.json.list)
    ? base.json.list
    : Array.isArray(base.json.news)
      ? base.json.news
      : [];
  const categories = Array.isArray(base.json.categories) ? base.json.categories : [];
  const details = base.json.details && typeof base.json.details === "object" ? base.json.details : null;
  const sample = list[0] ?? details ?? categories[0] ?? null;
  const sampleKeys = sample ? Object.keys(sample) : [];
  const contentText = details?.content ? normalizeSnippet(details.content, 9000) : "";
  const sampleText = sample ? normalizeSnippet(JSON.stringify(sanitizeSample(sample)), 240) : "";
  const periodSnippets = contentText
    ? uniq(PERIOD_PATTERNS.flatMap((pattern) => [...contentText.matchAll(pattern)].map((match) => normalizeSnippet(match[0], 180)))).slice(0, 8)
    : [];

  return {
    ...base,
    rootKeys,
    listCount: list.length,
    categoryCount: categories.length,
    pageInfoKeys: base.json.pageInfo ? Object.keys(base.json.pageInfo) : [],
    sampleKeys,
    detectedFields: {
      title: sampleKeys.includes("subject"),
      publishedDate: sampleKeys.includes("ymd") || sampleKeys.includes("post_time"),
      categories: sampleKeys.includes("categories"),
      articleId: sampleKeys.includes("topics_id"),
      slug: sampleKeys.includes("slug"),
      body: sampleKeys.includes("content") || Boolean(details?.content),
      thumbnail: sampleKeys.includes("thumb") || sampleKeys.includes("old_thumb"),
    },
    sample: sample
      ? {
          topics_id: sample.topics_id,
          slug: sample.slug,
          ymd: sample.ymd,
          post_time: sample.post_time,
          subject: sample.subject,
          categories: Array.isArray(sample.categories)
            ? sample.categories.map((category) => ({
                module_id: category.module_id,
                slug: category.slug,
              }))
            : [],
          contentLength: typeof sample.content === "string" ? sample.content.length : 0,
          excerptSnippet: sample.excerpt ? normalizeSnippet(sample.excerpt, 160) : "",
          contentSnippet: sample.content ? normalizeSnippet(sample.content, 180) : "",
        }
      : null,
    sampleText,
    periodSnippets,
  };
}

function sanitizeSample(sample) {
  return {
    topics_id: sample.topics_id,
    ymd: sample.ymd,
    post_time: sample.post_time,
    subject: sample.subject,
    slug: sample.slug,
    categories: Array.isArray(sample.categories)
      ? sample.categories.map((category) => ({
          module_id: category.module_id,
          slug: category.slug,
        }))
      : undefined,
    contentLength: typeof sample.content === "string" ? sample.content.length : undefined,
  };
}

function extractJsUrlsFromHtml(html, pageUrl) {
  const urls = [];
  const patterns = [
    /<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi,
    /<link\b[^>]*\bhref=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi,
    /import\(["']([^"']+\.js(?:\?[^"']*)?)["']\)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      try {
        urls.push(new URL(decodeBasicEntities(match[1]), pageUrl).toString());
      } catch {
        // Keep investigation best-effort.
      }
    }
  }
  return uniq(urls);
}

function extractImportedJsUrls(js, jsUrl) {
  const urls = [];
  const patterns = [
    /from["']([^"']+\.js(?:\?[^"']*)?)["']/g,
    /import\(["']([^"']+\.js(?:\?[^"']*)?)["']\)/g,
    /["'](\.\.\/(?:nodes|chunks|entry)\/[^"']+\.js(?:\?[^"']*)?)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of js.matchAll(pattern)) {
      try {
        urls.push(new URL(match[1], jsUrl).toString());
      } catch {
        // Ignore invalid candidates.
      }
    }
  }
  return uniq(urls);
}

function extractRouteNodeUrls(appJs, appUrl) {
  const urls = [];
  for (const match of appJs.matchAll(/\.\.\/nodes\/[^"']+\.js/g)) {
    try {
      urls.push(new URL(match[0], appUrl).toString());
    } catch {
      // Ignore invalid candidates.
    }
  }
  return uniq(urls);
}

function extractApiBaseUrls(jsResults) {
  const bases = [];
  for (const result of jsResults) {
    for (const match of result.text.matchAll(/https:\/\/granbluefantasy\.com\/rcms-api/g)) {
      bases.push(match[0]);
    }
  }
  return uniq(bases);
}

function extractEndpointUsages(jsResults) {
  const usages = [];
  for (const result of jsResults) {
    const patterns = [
      /endpoint:\s*["']([^"']+)["'][\s\S]{0,260}/g,
      /\{endpoint:\s*([^,}]+)[\s\S]{0,260}/g,
      /getContents\(\{([\s\S]{0,360}?)\}/g,
      /getContent\(\{([\s\S]{0,360}?)\}/g,
    ];
    for (const pattern of patterns) {
      for (const match of result.text.matchAll(pattern)) {
        const snippet = normalizeSnippet(match[0], 260);
        const endpoint = extractEndpointName(match[0]);
        usages.push({
          file: result.url,
          endpoint,
          snippet,
          terms: SEARCH_TERMS.filter((term) => match[0].toLowerCase().includes(term)),
        });
      }
    }
  }
  return uniqBy(usages, (item) => `${item.file}:${item.endpoint}:${item.snippet}`).slice(0, 40);
}

function extractEndpointName(value) {
  const direct = value.match(/endpoint:\s*["']([^"']+)["']/);
  if (direct) return direct[1];
  const ternary = value.match(/["']((?:wp_)?news(?:-archive)?(?:\/(?:details|preview))?|categorized-news|news-nav)["']/);
  return ternary?.[1] ?? "";
}

function uniqBy(values, keyFn) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = keyFn(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

function summarizeJsResult(url, text) {
  const lower = text.toLowerCase();
  const hitTerms = SEARCH_TERMS.filter((term) => lower.includes(term));
  const snippets = [];
  for (const term of hitTerms) {
    const index = lower.indexOf(term);
    snippets.push(normalizeSnippet(text.slice(Math.max(0, index - 90), index + 160), 220));
  }
  return {
    url,
    sizeBytes: Buffer.byteLength(text, "utf8"),
    hitTerms,
    snippets: uniq(snippets).slice(0, 5),
    text,
  };
}

async function collectJsInvestigation() {
  const pageResults = [];
  const seedJsUrls = [];
  for (const pageUrl of TARGET_PAGES) {
    const fetched = await fetchText(pageUrl, "text/html,application/xhtml+xml");
    pageResults.push({
      url: pageUrl,
      status: fetched.status,
      finalUrl: fetched.finalUrl,
      htmlSizeBytes: Buffer.byteLength(fetched.text, "utf8"),
      jsUrls: extractJsUrlsFromHtml(fetched.text, fetched.finalUrl),
    });
    seedJsUrls.push(...pageResults.at(-1).jsUrls);
  }

  const queue = uniq(seedJsUrls);
  const fetchedJs = new Map();
  for (let index = 0; index < queue.length && fetchedJs.size < 80; index += 1) {
    const jsUrl = queue[index];
    if (fetchedJs.has(jsUrl)) continue;
    try {
      const fetched = await fetchText(jsUrl, "*/*");
      if (!fetched.contentType.includes("javascript") && !fetched.finalUrl.includes("/_app/immutable/")) {
        continue;
      }
      const summary = summarizeJsResult(fetched.finalUrl, fetched.text);
      fetchedJs.set(jsUrl, summary);
      const imported = extractImportedJsUrls(fetched.text, fetched.finalUrl);
      const routeNodes = jsUrl.includes("/entry/app.") ? extractRouteNodeUrls(fetched.text, fetched.finalUrl) : [];
      for (const nextUrl of [...imported, ...routeNodes]) {
        if (nextUrl.startsWith(`${SITE_ORIGIN}/_app/immutable/`) && !fetchedJs.has(nextUrl)) {
          queue.push(nextUrl);
        }
      }
    } catch {
      // Keep crawling best-effort and low frequency.
    }
  }

  const jsResults = [...fetchedJs.values()];
  const relevantJs = jsResults.filter((result) => result.hitTerms.length > 0);
  return {
    pageResults,
    jsResults,
    relevantJs,
    apiBaseUrls: extractApiBaseUrls(jsResults),
    endpointUsages: extractEndpointUsages(jsResults),
  };
}

async function buildApiInvestigations(apiBase, apiId) {
  const base = `${apiBase.replace(/\/$/, "")}/${apiId}`;
  const navUrl = buildUrl(`${base}/news-nav`, { _lang: "ja" });
  const newsUrl = buildUrl(`${base}/news`, { cnt: 3, pageID: 1, _lang: "ja" });
  const detailUrl = buildUrl(`${base}/news/details/9690`, { cnt: 1, _lang: "ja" });
  const archiveMayUrl = buildUrl(`${base}/news-archive`, {
    cnt: 3,
    pageID: 1,
    filter: '(ymd >= "2026-05-01" AND ymd <= "2026-05-31")',
    _lang: "ja",
  });
  const archiveAprUrl = buildUrl(`${base}/news-archive`, {
    cnt: 3,
    pageID: 1,
    filter: '(ymd >= "2026-04-01" AND ymd <= "2026-04-30")',
    _lang: "ja",
  });

  const nav = await fetchJsonSummary("news-nav", navUrl);
  const updateCategoryId = nav.json?.categories?.find((category) => category.slug === "update")?.topics_id;
  const categorizedUrl = buildUrl(`${base}/categorized-news`, {
    cnt: 3,
    pageID: 1,
    filter: updateCategoryId ? `categories.module_id contains ${updateCategoryId}` : undefined,
    _lang: "ja",
  });

  const targets = [
    nav,
    await fetchJsonSummary("NEWS一覧", newsUrl),
    await fetchJsonSummary("カテゴリ別NEWS update", categorizedUrl),
    await fetchJsonSummary("月別アーカイブ 2026-05", archiveMayUrl),
    await fetchJsonSummary("月別アーカイブ 2026-04", archiveAprUrl),
    await fetchJsonSummary("記事詳細 9690", detailUrl),
  ];

  return {
    targets,
    updateCategoryId,
    apiBase,
    apiId,
  };
}

async function tryLoadPlaywright() {
  try {
    const module = await import("playwright");
    return { chromium: module.chromium, error: "" };
  } catch (error) {
    return {
      chromium: null,
      error: error instanceof Error ? error.message.replace(/\n[\s\S]*/g, "") : String(error),
    };
  }
}

async function investigateRenderedDom() {
  const { chromium, error } = await tryLoadPlaywright();
  if (!chromium) return { available: false, error, pages: [] };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (launchError) {
    const missingLibraries = await findMissingBrowserLibraries(chromium.executablePath());
    return {
      available: false,
      error: launchError instanceof Error ? launchError.message.replace(/\n[\s\S]*/g, "") : String(launchError),
      missingLibraries,
      pages: [],
    };
  }

  const pages = [];
  try {
    for (const url of TARGET_PAGES) {
      const page = await browser.newPage({ userAgent: USER_AGENT, locale: "ja-JP" });
      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        const result = await page.evaluate(() => {
          const clean = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
          const links = [...document.querySelectorAll("a[href*='/ja/news/'], a[href^='/ja/news/']")]
            .map((element) => ({
              text: clean(element.textContent),
              href: element.href,
            }))
            .filter((item) => /\/ja\/news\/(?:p)?\d+\/?$/.test(item.href))
            .slice(0, 8);
          const cards = [...document.querySelectorAll(".news-card, .new-link, .article, .filtered-list li")]
            .map((element) => clean(element.textContent))
            .filter(Boolean)
            .slice(0, 8);
          const title = clean(document.querySelector(".article__title, h1, h2")?.textContent);
          const date = clean(document.querySelector("time, .news-card__date, .article__date, .date")?.textContent);
          const categories = [...document.querySelectorAll(".category, .category-label")]
            .map((element) => clean(element.textContent))
            .filter(Boolean)
            .slice(0, 8);
          return { links, cards, title, date, categories };
        });
        pages.push({
          url,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          linkCount: result.links.length,
          cardCount: result.cards.length,
          links: result.links.slice(0, 5),
          cardSnippets: result.cards.map((item) => normalizeSnippet(item, 160)).slice(0, 5),
          title: normalizeSnippet(result.title, 140),
          date: normalizeSnippet(result.date, 80),
          categories: result.categories,
        });
      } catch (pageError) {
        pages.push({ url, error: pageError instanceof Error ? pageError.message : String(pageError) });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return { available: true, pages, error: "" };
}

async function findMissingBrowserLibraries(executablePath) {
  if (process.platform !== "linux") return [];
  try {
    const { stdout } = await execFileAsync("ldd", [executablePath], { timeout: 5000 });
    return stdout
      .split("\n")
      .filter((line) => line.includes("not found"))
      .map((line) => line.trim().replace(/\s+=>\s+not found$/, ""))
      .sort();
  } catch {
    return [];
  }
}

function collectFieldNames(apiResults) {
  const names = new Set();
  for (const result of apiResults.targets) {
    for (const key of result.sampleKeys ?? []) names.add(key);
  }
  return [...names].sort();
}

function renderApiResult(result) {
  const lines = [];
  lines.push(`### ${result.name}`);
  lines.push("");
  lines.push(`- URL: ${result.url}`);
  if (result.error) {
    lines.push(`- エラー: ${result.error}`);
    return lines;
  }
  lines.push(`- HTTPステータスコード: ${result.status}`);
  lines.push(`- Content-Type: ${result.contentType}`);
  lines.push(`- レスポンスサイズ: ${result.sizeBytes} bytes`);
  lines.push(`- ルートキー: ${(result.rootKeys ?? []).join(", ") || "なし"}`);
  lines.push(`- list件数: ${result.listCount ?? 0}`);
  lines.push(`- categories件数: ${result.categoryCount ?? 0}`);
  lines.push(`- pageInfoキー: ${(result.pageInfoKeys ?? []).join(", ") || "なし"}`);
  lines.push(`- サンプルキー: ${(result.sampleKeys ?? []).join(", ") || "なし"}`);
  if (result.detectedFields) {
    lines.push(
      `- フィールド検出: title=${yesNo(result.detectedFields.title)}, publishedDate=${yesNo(result.detectedFields.publishedDate)}, category=${yesNo(result.detectedFields.categories)}, articleId=${yesNo(result.detectedFields.articleId)}, slug=${yesNo(result.detectedFields.slug)}, body=${yesNo(result.detectedFields.body)}`,
    );
  }
  if (result.sample) {
    lines.push(`- サンプル: id=${result.sample.topics_id ?? "なし"}, date=${result.sample.ymd ?? "なし"} ${result.sample.post_time ?? ""}, slug=${result.sample.slug || "なし"}`);
    lines.push(`- タイトルスニペット: ${result.sample.subject || "なし"}`);
    if (result.sample.categories?.length) {
      lines.push(`- カテゴリ参照: ${result.sample.categories.map((category) => `${category.module_id}${category.slug ? `:${category.slug}` : ""}`).join(", ")}`);
    }
    lines.push(`- 本文長: ${result.sample.contentLength ?? 0}`);
    if (result.sample.contentSnippet) lines.push(`- 本文確認スニペット: ${result.sample.contentSnippet}`);
    if (result.sample.excerptSnippet) lines.push(`- excerptスニペット: ${result.sample.excerptSnippet}`);
  }
  lines.push(`- 開催期間・実施期間候補: ${yesNo((result.periodSnippets ?? []).length > 0)} (${(result.periodSnippets ?? []).length}件)`);
  lines.push(markdownList(result.periodSnippets ?? []));
  return lines;
}

function renderReport({ generatedAt, jsInvestigation, apiResults, renderedDom, withDepsAttempt }) {
  const fieldNames = collectFieldNames(apiResults);
  const hasBase = jsInvestigation.apiBaseUrls.length > 0;
  const newsApi = apiResults.targets.find((result) => result.name === "NEWS一覧");
  const categorizedApi = apiResults.targets.find((result) => result.name.includes("カテゴリ別"));
  const archiveApis = apiResults.targets.filter((result) => result.name.includes("月別アーカイブ"));
  const detailApi = apiResults.targets.find((result) => result.name.includes("記事詳細"));
  const apiUsable =
    newsApi?.status === 200 &&
    newsApi.listCount > 0 &&
    categorizedApi?.status === 200 &&
    archiveApis.some((result) => result.status === 200 && result.listCount > 0) &&
    detailApi?.status === 200 &&
    detailApi.detectedFields?.body;

  const lines = [];
  lines.push("# 公式NEWS rcms-api 調査結果");
  lines.push("");
  lines.push(`生成日時: ${generatedAt}`);
  lines.push("");
  lines.push("## 方針");
  lines.push("");
  lines.push("- 公式本文全文、公式画像、HTML全文、JSON全文は保存しない。");
  lines.push("- 保存するのは検出件数、URL、キー名、短い確認用スニペット、判定のみ。");
  lines.push("- APIアクセスは確認済み候補に対する少数リクエストに限定し、総当たりは行わない。");
  lines.push("- 本調査は本実装前の取得可否確認であり、常時スクレイピング機能ではない。");
  lines.push("");

  lines.push("## 結論");
  lines.push("");
  lines.push(`1. rcms-api の base URL: ${hasBase ? jsInvestigation.apiBaseUrls.join(", ") : "未確認"}`);
  lines.push(`2. NEWS一覧取得API: ${newsApi?.status === 200 && newsApi.listCount > 0 ? "確認できた" : "未確認"}`);
  lines.push(`3. カテゴリ別NEWS取得API: ${categorizedApi?.status === 200 && categorizedApi.listCount > 0 ? "確認できた" : "未確認"}`);
  lines.push(`4. 月別アーカイブ取得API: ${archiveApis.some((result) => result.status === 200 && result.listCount > 0) ? "確認できた" : "未確認"}`);
  lines.push(`5. 記事詳細取得API: ${detailApi?.status === 200 && detailApi.detectedFields?.body ? "確認できた" : "未確認"}`);
  lines.push(`6. 本実装に使えそうか: ${apiUsable ? "使えそう。Playwrightなしで rcms-api 直接取得を優先できる。" : "要追加調査"}`);
  lines.push(`7. Playwrightを本実装に使う必要: ${apiUsable ? "現時点では不要。API障害時の手動調査・検証用に留めるのがよい。" : "APIが不安定なら代替候補"}`);
  lines.push("");

  lines.push("## JS調査");
  lines.push("");
  lines.push(`- 対象ページ数: ${jsInvestigation.pageResults.length}`);
  lines.push(`- 取得JS数: ${jsInvestigation.jsResults.length}`);
  lines.push(`- news/archive/category/api/rcms-api を含むJS数: ${jsInvestigation.relevantJs.length}`);
  lines.push(`- API base URL候補: ${jsInvestigation.apiBaseUrls.join(", ") || "なし"}`);
  lines.push("");
  lines.push("### 関連JSファイル");
  lines.push("");
  for (const result of jsInvestigation.relevantJs.slice(0, 20)) {
    lines.push(`- ${result.url} (${result.sizeBytes} bytes): ${result.hitTerms.join(", ")}`);
    for (const snippet of result.snippets.slice(0, 2)) lines.push(`  - ${snippet}`);
  }
  lines.push("");

  lines.push("### JS内のAPI利用候補");
  lines.push("");
  for (const usage of jsInvestigation.endpointUsages) {
    lines.push(`- file: ${usage.file}`);
    lines.push(`  - endpoint: ${usage.endpoint || "式/動的指定"}`);
    lines.push(`  - snippet: ${usage.snippet}`);
  }
  lines.push("");

  lines.push("## API直接fetch結果");
  lines.push("");
  lines.push(`- apiId: ${apiResults.apiId}`);
  lines.push(`- updateカテゴリ topics_id: ${apiResults.updateCategoryId ?? "未確認"}`);
  lines.push("");
  for (const result of apiResults.targets) {
    lines.push(...renderApiResult(result));
    lines.push("");
  }

  lines.push("## 取得できたフィールド一覧");
  lines.push("");
  lines.push(markdownList(fieldNames));
  lines.push("");

  lines.push("## saisoku側で保存できそうな項目");
  lines.push("");
  lines.push("- `topics_id`: 公式記事ID。詳細URL `/ja/news/{topics_id}/` の生成に使える。");
  lines.push("- `slug`: ある場合は公式表示と同じ記事URL補助に使える。空の場合は `topics_id` を使う。");
  lines.push("- `subject`: 記事タイトル。");
  lines.push("- `ymd` + `post_time`: 公開日・公開時刻。");
  lines.push("- `categories[].module_id` と `news-nav.categories`: カテゴリ名解決。");
  lines.push("- `excerpt`: 一覧用の短い説明候補。保存する場合も全文コピーにならない範囲で扱う。");
  lines.push("- `content`: 記事詳細本文。保存は全文ではなく、必要な開催期間・実施期間などの抽出結果と参照URLに留める。");
  lines.push("- `thumb` / `old_thumb`: 公式画像URL候補。saisoku方針上、直接保存・直接依存は避ける。");
  lines.push("");

  lines.push("## APIが使えない場合の代替案");
  lines.push("");
  lines.push("- 公式ページURLを参考URLとして保存し、人間が内容を確認して必要項目のみメモ化する。");
  lines.push("- Playwrightレンダリング後DOMを調査用に使う。ただし運用機能としては依存ライブラリ・実行コスト・外部負荷が重い。");
  lines.push("- API仕様変更時は、JS内の `getContents` / `getContent` 使用箇所を再調査してエンドポイントだけ更新する。");
  lines.push("");

  lines.push("## Playwrightレンダリング後DOM");
  lines.push("");
  lines.push(`- 指定コマンド試行: ${withDepsAttempt}`);
  if (!renderedDom.available) {
    lines.push("- 判定: 未実行");
    lines.push(`- 理由: ${renderedDom.error}`);
    if (renderedDom.missingLibraries?.length) {
      lines.push("- lddで検出した不足ライブラリ:");
      for (const library of renderedDom.missingLibraries) lines.push(`  - ${library}`);
    }
  } else {
    lines.push("- 判定: 実行済み");
    for (const page of renderedDom.pages) {
      lines.push(`### ${page.url}`);
      if (page.error) {
        lines.push(`- エラー: ${page.error}`);
        continue;
      }
      lines.push(`- HTTPステータスコード: ${page.status}`);
      lines.push(`- 最終URL: ${page.finalUrl}`);
      lines.push(`- 記事リンク候補: ${page.linkCount}件`);
      lines.push(`- カード/記事候補: ${page.cardCount}件`);
      lines.push(`- タイトル候補: ${page.title || "なし"}`);
      lines.push(`- 日時候補: ${page.date || "なし"}`);
      lines.push(`- カテゴリ候補: ${page.categories.join(", ") || "なし"}`);
      lines.push(markdownList(page.cardSnippets));
    }
  }
  lines.push("");

  lines.push("## 実行方法");
  lines.push("");
  lines.push("```bash");
  lines.push("node scripts/investigateOfficialNewsApi.mjs");
  lines.push("```");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const jsInvestigation = await collectJsInvestigation();
  const apiBase = jsInvestigation.apiBaseUrls[0] ?? FALLBACK_API_BASE;
  const apiResults = await buildApiInvestigations(apiBase, FALLBACK_API_ID);
  const renderedDom = await investigateRenderedDom();
  const report = renderReport({
    generatedAt: new Date().toISOString(),
    jsInvestigation,
    apiResults,
    renderedDom,
    withDepsAttempt:
      "npx playwright install --with-deps chromium は試行済み。sudo パスワード要求でOS依存ライブラリ導入は未完了。",
  });
  await fs.writeFile(outputPath, report, "utf8");
  console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
