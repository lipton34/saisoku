import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const TARGET_URLS = [
  "https://granbluefantasy.com/ja/news/",
  "https://granbluefantasy.com/ja/news/category/",
  "https://granbluefantasy.com/ja/news/category/?p=update",
  "https://granbluefantasy.com/ja/news/archive/?p=20265",
  "https://granbluefantasy.com/ja/news/archive/?p=20264",
  "https://granbluefantasy.com/ja/news/9690/",
];

const USER_AGENT =
  "saisoku-news-investigation/0.1 (+https://github.com/internal/saisoku; pre-implementation reachability check)";

const SEARCH_TERMS = ["news", "archive", "category", "api"];
const CATEGORY_PATTERNS = [
  "アップデート",
  "イベント",
  "キャンペーン",
  "メンテナンス",
  "不具合",
  "重要",
  "update",
  "event",
  "campaign",
  "maintenance",
];
const PERIOD_PATTERNS = [
  /開催期間[:：]?\s*[^<\n]{0,80}/g,
  /実施期間[:：]?\s*[^<\n]{0,80}/g,
  /期間[:：]?\s*[^<\n]{0,80}/g,
  /\d{4}年\d{1,2}月\d{1,2}日\s*\([^)]*\)\s*\d{1,2}:\d{2}\s*(?:～|~|から|より)\s*[^<\n]{0,80}/g,
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "docs", "news_scraping_investigation.md");
const execFileAsync = promisify(execFile);

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

function normalizeSnippet(value, maxLength = 160) {
  const normalized = decodeBasicEntities(stripTags(value)).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function countMatches(html, pattern) {
  return html.match(pattern)?.length ?? 0;
}

function findSnippets(html, patterns, max = 5) {
  const snippets = [];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      snippets.push(normalizeSnippet(match[0]));
      if (snippets.length >= max) return uniq(snippets);
    }
  }
  return uniq(snippets);
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeSnippet(match[1], 120) : "";
}

function extractScriptSources(html, baseUrl) {
  const sources = [];
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    try {
      sources.push(new URL(decodeBasicEntities(match[1]), baseUrl).toString());
    } catch {
      sources.push(match[1]);
    }
  }

  for (const match of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi)) {
    try {
      sources.push(new URL(decodeBasicEntities(match[1]), baseUrl).toString());
    } catch {
      sources.push(match[1]);
    }
  }

  return uniq(sources);
}

function extractArticleUrls(html, baseUrl) {
  const urls = [];
  for (const match of html.matchAll(/href=["']([^"']*\/ja\/news\/\d+\/?[^"']*)["']/gi)) {
    try {
      urls.push(new URL(decodeBasicEntities(match[1]), baseUrl).toString());
    } catch {
      urls.push(match[1]);
    }
  }
  return uniq(urls);
}

function extractArticleTitleCandidates(html) {
  const candidates = [];
  const patterns = [
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi,
    /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi,
    /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi,
    /class=["'][^"']*(?:title|ttl|headline|article)[^"']*["'][^>]*>([\s\S]{0,240}?)<\/[^>]+>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const snippet = normalizeSnippet(match[1], 120);
      if (isArticleSpecificTitle(snippet)) candidates.push(snippet);
      if (candidates.length >= 8) return uniq(candidates);
    }
  }

  return uniq(candidates);
}

function isArticleSpecificTitle(value) {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  if (normalized.length < 4) return false;
  if (["news", "content", "contents", "officialaccount"].includes(normalized)) return false;
  if (/^(world|character|system|interview|channel|ja\/en)$/i.test(value.trim())) return false;
  return /[ぁ-んァ-ヶ一-龠]/.test(value) || normalized.length >= 12;
}

function extractDateSnippets(html) {
  return findSnippets(
    html,
    [
      /\d{4}\.\d{1,2}\.\d{1,2}/g,
      /\d{4}\/\d{1,2}\/\d{1,2}/g,
      /\d{4}-\d{1,2}-\d{1,2}/g,
      /\d{4}年\d{1,2}月\d{1,2}日/g,
      /datetime=["'][^"']+["']/gi,
      /datePublished["']?\s*[:=]\s*["'][^"']+["']/gi,
    ],
    8,
  );
}

function detectJsonLikeData(html) {
  const snippets = [];
  const jsonScriptPattern =
    /<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(jsonScriptPattern)) {
    snippets.push(normalizeSnippet(match[1], 180));
  }

  const inlineJsonPatterns = [
    /window\.[A-Za-z0-9_$]+\s*=\s*\{[\s\S]{0,500}?\};/g,
    /__NEXT_DATA__|application\/ld\+json|JSON\.parse|wp-json|REST_API|api/gi,
  ];
  for (const pattern of inlineJsonPatterns) {
    for (const match of html.matchAll(pattern)) {
      snippets.push(normalizeSnippet(match[0], 180));
      if (snippets.length >= 6) break;
    }
  }

  return uniq(snippets).slice(0, 6);
}

function analyzeHtml(html, finalUrl) {
  const articleUrls = extractArticleUrls(html, finalUrl);
  const articleTitleCandidates = extractArticleTitleCandidates(html);
  const dateSnippets = extractDateSnippets(html);
  const categorySnippets = CATEGORY_PATTERNS.filter((term) =>
    html.toLowerCase().includes(term.toLowerCase()),
  );
  const jsonSnippets = detectJsonLikeData(html);
  const periodSnippets = findSnippets(html, PERIOD_PATTERNS, 8);

  const bodyText = normalizeSnippet(html.replace(/<script[\s\S]*?<\/script>/gi, " "), 1000);
  const bodySnippet = bodyText ? bodyText.slice(0, 240) : "";

  return {
    htmlSizeBytes: Buffer.byteLength(html, "utf8"),
    title: extractTitle(html),
    scriptTagCount: countMatches(html, /<script\b/gi),
    linkTagCount: countMatches(html, /<link\b/gi),
    articleTitleCandidates,
    dateSnippets,
    categorySnippets,
    articleUrls,
    jsonSnippets,
    periodSnippets,
    bodySnippet,
    hasMeaningfulArticleBody:
      articleTitleCandidates.length > 0 ||
      dateSnippets.length > 0 ||
      periodSnippets.length > 0 ||
      bodyText.length >= 500,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "ja,en-US;q=0.8,en;q=0.6",
    },
  });
  return {
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
}

async function fetchScriptSignal(scriptUrl) {
  try {
    const response = await fetch(scriptUrl, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "*/*",
      },
    });
    const text = await response.text();
    const hits = Object.fromEntries(
      SEARCH_TERMS.map((term) => [term, text.toLowerCase().includes(term)]),
    );
    const snippets = [];
    for (const term of SEARCH_TERMS) {
      const index = text.toLowerCase().indexOf(term);
      if (index >= 0) snippets.push(normalizeSnippet(text.slice(Math.max(0, index - 50), index + 80)));
    }
    return {
      url: response.url,
      status: response.status,
      sizeBytes: Buffer.byteLength(text, "utf8"),
      hits,
      snippets: uniq(snippets).slice(0, 4),
    };
  } catch (error) {
    return {
      url: scriptUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function tryLoadPlaywright() {
  try {
    const module = await import("playwright");
    return { chromium: module.chromium, error: "" };
  } catch (error) {
    return {
      chromium: null,
      error:
        error instanceof Error
          ? error.message.replace(/\n[\s\S]*/g, "")
          : String(error),
    };
  }
}

async function investigateRenderedDom(urls) {
  const { chromium, error } = await tryLoadPlaywright();
  if (!chromium) {
    return {
      available: false,
      error,
      pages: [],
    };
  }

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
    for (const url of urls) {
      const page = await browser.newPage({
        userAgent: USER_AGENT,
        locale: "ja-JP",
      });
      try {
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        const html = await page.content();
        const anchors = await page.$$eval("a[href*='/ja/news/']", (elements) =>
          elements
            .map((element) => ({
              text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
              href: element.href,
            }))
            .filter((item) => /\/ja\/news\/\d+\/?$/.test(item.href))
            .slice(0, 10),
        );
        const articleLikeCount = anchors.length;
        pages.push({
          url,
          finalUrl: page.url(),
          status: response?.status() ?? null,
          domSizeBytes: Buffer.byteLength(html, "utf8"),
          articleLikeCount,
          anchors: anchors.slice(0, 5),
        });
      } catch (pageError) {
        pages.push({
          url,
          error: pageError instanceof Error ? pageError.message : String(pageError),
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return {
    available: true,
    error: "",
    pages,
  };
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

function markdownList(values, emptyText = "なし") {
  if (!values?.length) return emptyText;
  return values.map((value) => `  - ${String(value).replace(/\n/g, " ")}`).join("\n");
}

function booleanLabel(value) {
  return value ? "あり" : "なし";
}

function verdictForPage(result) {
  if (result.error) return "取得失敗";
  if (result.status < 200 || result.status >= 400) return "HTTP要確認";
  if (result.analysis.articleUrls.length || result.analysis.articleTitleCandidates.length) return "HTMLから記事固有情報の取得候補あり";
  if (result.analysis.jsonSnippets.length) return "HTMLはページシェル中心、記事固有情報は要追加調査";
  return "HTML直接取得は要追加調査";
}

function renderReport({ generatedAt, pageResults, renderedResult, scriptResultsByPage }) {
  const lines = [];
  lines.push("# 公式NEWS取得可否 調査結果");
  lines.push("");
  lines.push(`生成日時: ${generatedAt}`);
  lines.push("");
  lines.push("## 方針");
  lines.push("");
  lines.push("- 対象ページのHTML本文そのものは保存しない。");
  lines.push("- 保存するのは件数、検出結果、短い確認用スニペット、URL、判定のみ。");
  lines.push("- 本スクリプトは本実装前の到達性・構造確認用であり、常時スクレイピング機能ではない。");
  lines.push("");
  lines.push("## 総合判定");
  lines.push("");
  for (const result of pageResults) {
    lines.push(`- ${result.url}: ${verdictForPage(result)}`);
  }
  if (!renderedResult.available) {
    lines.push(`- Playwright: 未実行（${renderedResult.error}）`);
  } else {
    const renderedHits = renderedResult.pages.filter((page) => page.articleLikeCount > 0).length;
    lines.push(`- Playwright: 実行済み（記事リンク候補あり ${renderedHits}/${renderedResult.pages.length} ページ）`);
  }
  lines.push("");

  lines.push("## 対象URL別結果");
  lines.push("");
  for (const result of pageResults) {
    lines.push(`### ${result.url}`);
    lines.push("");
    if (result.error) {
      lines.push(`- 取得エラー: ${result.error}`);
      lines.push("");
      continue;
    }
    const analysis = result.analysis;
    lines.push(`- HTTPステータスコード: ${result.status}`);
    lines.push(`- 最終URL: ${result.finalUrl}`);
    lines.push(`- Content-Type: ${result.contentType}`);
    lines.push(`- HTMLサイズ: ${analysis.htmlSizeBytes} bytes`);
    lines.push(`- titleタグ: ${analysis.title || "なし"}`);
    lines.push(`- scriptタグの数: ${analysis.scriptTagCount}`);
    lines.push(`- linkタグの数: ${analysis.linkTagCount}`);
    lines.push(`- HTML内の記事タイトル候補: ${booleanLabel(analysis.articleTitleCandidates.length > 0)} (${analysis.articleTitleCandidates.length}件)`);
    lines.push(markdownList(analysis.articleTitleCandidates.slice(0, 5)));
    lines.push(`- HTML内の公開日時らしき文字列: ${booleanLabel(analysis.dateSnippets.length > 0)} (${analysis.dateSnippets.length}件)`);
    lines.push(markdownList(analysis.dateSnippets.slice(0, 5)));
    lines.push(`- HTML内のカテゴリ文字列: ${booleanLabel(analysis.categorySnippets.length > 0)} (${analysis.categorySnippets.length}件)`);
    lines.push(markdownList(analysis.categorySnippets.slice(0, 8)));
    lines.push(`- HTML内の記事詳細URL: ${booleanLabel(analysis.articleUrls.length > 0)} (${analysis.articleUrls.length}件)`);
    lines.push(markdownList(analysis.articleUrls.slice(0, 8)));
    lines.push(`- HTML内のJSONらしきデータ: ${booleanLabel(analysis.jsonSnippets.length > 0)} (${analysis.jsonSnippets.length}件)`);
    lines.push(markdownList(analysis.jsonSnippets.slice(0, 5)));
    lines.push(`- 本文/ページテキスト確認スニペット: ${analysis.bodySnippet || "なし"}`);
    if (result.url.includes("/ja/news/9690/")) {
      lines.push(`- 記事詳細ページの本文候補: ${booleanLabel(analysis.hasMeaningfulArticleBody)}`);
      lines.push(`- 開催期間・実施期間候補: ${booleanLabel(analysis.periodSnippets.length > 0)} (${analysis.periodSnippets.length}件)`);
      lines.push(markdownList(analysis.periodSnippets.slice(0, 8)));
    }

    const scriptResults = scriptResultsByPage.get(result.url) ?? [];
    const scriptHits = scriptResults.filter((script) =>
      script.hits ? Object.values(script.hits).some(Boolean) : false,
    );
    lines.push(`- JavaScriptファイル内の news/archive/category/api 文字列: ${booleanLabel(scriptHits.length > 0)} (${scriptHits.length}/${scriptResults.length}ファイル)`);
    for (const script of scriptHits.slice(0, 5)) {
      const hitTerms = Object.entries(script.hits)
        .filter(([, hit]) => hit)
        .map(([term]) => term)
        .join(", ");
      lines.push(`  - ${script.url} (${script.status}, ${script.sizeBytes} bytes): ${hitTerms}`);
      for (const snippet of script.snippets ?? []) lines.push(`    - ${snippet}`);
    }
    lines.push("");
  }

  lines.push("## Playwrightレンダリング後DOM");
  lines.push("");
  if (!renderedResult.available) {
    lines.push(`- 判定: 未実行`);
    lines.push(`- 理由: Playwright の読み込みまたはブラウザ起動に失敗したため。必要な場合は dev dependency、ブラウザ、OS依存ライブラリを導入してから再実行する。`);
    lines.push(`- エラー: ${renderedResult.error}`);
    if (renderedResult.missingLibraries?.length) {
      lines.push(`- lddで検出した不足ライブラリ:`);
      for (const library of renderedResult.missingLibraries) lines.push(`  - ${library}`);
    }
  } else {
    for (const page of renderedResult.pages) {
      lines.push(`### ${page.url}`);
      if (page.error) {
        lines.push(`- エラー: ${page.error}`);
      } else {
        lines.push(`- HTTPステータスコード: ${page.status}`);
        lines.push(`- 最終URL: ${page.finalUrl}`);
        lines.push(`- DOMサイズ: ${page.domSizeBytes} bytes`);
        lines.push(`- 記事一覧/詳細リンク候補: ${booleanLabel(page.articleLikeCount > 0)} (${page.articleLikeCount}件)`);
        for (const anchor of page.anchors) lines.push(`  - ${anchor.text || "(textなし)"}: ${anchor.href}`);
      }
      lines.push("");
    }
  }

  lines.push("## スクリプト実行方法");
  lines.push("");
  lines.push("```bash");
  lines.push("node scripts/investigateOfficialNews.mjs");
  lines.push("```");
  lines.push("");
  lines.push("Playwright項目まで確認する場合は、プロジェクトに Playwright を導入した状態で同じコマンドを実行する。");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const pageResults = [];
  const scriptResultsByPage = new Map();

  for (const url of TARGET_URLS) {
    try {
      const fetched = await fetchText(url);
      const analysis = analyzeHtml(fetched.text, fetched.finalUrl);
      pageResults.push({
        url,
        status: fetched.status,
        finalUrl: fetched.finalUrl,
        contentType: fetched.contentType,
        analysis,
      });

      const scriptSources = extractScriptSources(fetched.text, fetched.finalUrl).slice(0, 20);
      const scriptResults = [];
      for (const scriptSource of scriptSources) {
        scriptResults.push(await fetchScriptSignal(scriptSource));
      }
      scriptResultsByPage.set(url, scriptResults);
    } catch (error) {
      pageResults.push({
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      scriptResultsByPage.set(url, []);
    }
  }

  const renderedResult = await investigateRenderedDom(TARGET_URLS);
  const markdown = renderReport({
    generatedAt: new Date().toISOString(),
    pageResults,
    renderedResult,
    scriptResultsByPage,
  });
  await fs.writeFile(outputPath, markdown, "utf8");
  console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
