import type { ReactNode } from "react";

const pageLinkPattern = /\[\[page:([^|\]]+)\|([^\]]+)\]\]/g;

export type RaidGuidePageLink = { rowId: string; label: string };

export function RaidGuideLinkedText({ children, onJump }: { children: string; onJump: (rowId: string) => void }) {
  const parts: ReactNode[] = [];
  let position = 0;
  for (const match of children.matchAll(pageLinkPattern)) {
    const index = match.index ?? 0;
    if (index > position) parts.push(children.slice(position, index));
    parts.push(<button className="raid-inline-page-link" key={`${index}-${match[1]}`} onClick={() => onJump(match[1])} type="button">{match[2]}</button>);
    position = index + match[0].length;
  }
  if (position < children.length) parts.push(children.slice(position));
  return <>{parts}</>;
}

export function createRaidGuidePageLink(rowId: string, label: string) {
  return `[[page:${rowId}|${label.replace(/[\[\]|]/g, "").trim()}]]`;
}

export function splitRaidGuideLinkedText(value: string) {
  const links: RaidGuidePageLink[] = [...value.matchAll(pageLinkPattern)].map((match) => ({ rowId: match[1], label: match[2] }));
  return { text: value.replace(pageLinkPattern, "").trim(), links };
}

export function plainRaidGuideLinkedText(value: string) {
  return value.replace(pageLinkPattern, "$2");
}

export function joinRaidGuideLinkedText(text: string, links: RaidGuidePageLink[]) {
  const suffix = links.map((link) => createRaidGuidePageLink(link.rowId, link.label)).join(" ");
  return [text.trim(), suffix].filter(Boolean).join("\n");
}
