import type { ExtractedNewsItem, SourceArticle } from "@prisma/client";

type EventKeyInput = Pick<ExtractedNewsItem, "title" | "relatedKey" | "eventType" | "itemType"> & {
  sourceArticle?: Pick<SourceArticle, "title"> | null;
};

const phraseReplacements: [RegExp, string][] = [
  [/四象降臨/g, "rotb"],
  [/ドレッドバラージュ/g, "dread_barrage"],
  [/鋼の錬金術師\s*fullmetal\s*alchemist\s*コラボ/gi, "fullmetal_alchemist_collab"],
  [/鋼の錬金術師\s*fullmetal\s*alchemist/gi, "fullmetal_alchemist_collab"],
  [/heart\s*of\s*the\s*sun/gi, "heart_of_the_sun"],
];

const removablePhrases = [
  "キャンペーン開催のお知らせ",
  "開催のお知らせ",
  "開催予定",
  "復刻",
  "後編追加",
  "更新のお知らせ",
  "これからの『グランブルーファンタジー』",
  "これからの「グランブルーファンタジー」",
  "グランブルーファンタジー",
  "【グランブルーファンタジー】",
  "New!",
];

export function buildEventKey(input: EventKeyInput) {
  const source = input.relatedKey || input.title || input.sourceArticle?.title || input.eventType || input.itemType;
  return normalizeEventKey(source);
}

export function normalizeEventKey(value: string) {
  let normalized = value
    .normalize("NFKC")
    .replace(/^\d+:/, "")
    .toLowerCase();

  for (const [pattern, replacement] of phraseReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  for (const phrase of removablePhrases) {
    normalized = normalized.replaceAll(phrase.normalize("NFKC").toLowerCase(), "");
  }

  return normalized
    .replace(/[【】「」『』（）()[\]{}]/g, " ")
    .replace(/[!"#$%&'*,./:;<=>?@\\^`|~、。・…]/g, " ")
    .replace(/[+\-–—]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 120) || "unknown_event";
}

export function eventKeySimilarity(a: string, b: string) {
  const left = new Set(a.split("_").filter((part) => part.length >= 2));
  const right = new Set(b.split("_").filter((part) => part.length >= 2));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((part) => right.has(part)).length;
  return intersection / Math.max(left.size, right.size);
}
