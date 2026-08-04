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

export function RaidGuideStructuredText({ children, onJump }: { children: string; onJump: (rowId: string) => void }) {
  const lines = children.split("\n");
  return <div className="raid-reader-facts">{lines.map((line, index) => {
    if (!line.trim()) return <span aria-hidden="true" className="raid-reader-fact-break" key={`break-${index}`} />;
    const bullet = line.startsWith("・") ? line.slice(1).trim() : null;
    const labelSeparator = bullet?.indexOf("：") ?? -1;
    if (bullet !== null && labelSeparator > 0) {
      const label = bullet.slice(0, labelSeparator);
      const value = bullet.slice(labelSeparator + 1);
      return <span className="raid-reader-fact" key={`${line}-${index}`}><strong>{label}</strong><span><RaidGuideLinkedText onJump={onJump}>{value}</RaidGuideLinkedText></span></span>;
    }
    const isTitle = index === 0 && !line.includes("[[page:");
    return <span className={`raid-reader-fact${isTitle ? " is-title" : ""}${line.includes("[[page:") ? " is-link" : ""}`} key={`${line}-${index}`}><RaidGuideLinkedText onJump={onJump}>{bullet ?? line}</RaidGuideLinkedText></span>;
  })}</div>;
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
