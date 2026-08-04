import type { ReactNode } from "react";

const pageLinkPattern = /\[\[page:([^|\]]+)\|([^\]]+)\]\]/g;

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
