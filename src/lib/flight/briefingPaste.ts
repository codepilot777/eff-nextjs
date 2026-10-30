export type NotamPasteScope = "dep" | "arr" | "alt" | "toff_alt" | "enroute_alt" | "enroute";

export interface NotamPasteBlock {
  scope: NotamPasteScope;
  icao: string;
  content: string;
}

export interface WxPasteBlock {
  field: "metar" | "taf";
  scope: NotamPasteScope;
  icao: string;
  content: string;
}

function splitBlocks<T extends { content: string }>(
  input: string,
  parseHeader: (line: string) => Omit<T, "content"> | null,
): T[] {
  const blocks: T[] = [];
  let current: Omit<T, "content"> | null = null;
  let contentLines: string[] = [];

  const flush = () => {
    if (!current) return;
    blocks.push({ ...current, content: contentLines.join("\n").trim() } as T);
  };

  for (const line of input.split(/\r?\n/)) {
    const header = parseHeader(line.trim());
    if (header) {
      flush();
      current = header;
      const colon = line.indexOf(":");
      const inlineContent = colon >= 0 ? line.slice(colon + 1).trim() : "";
      contentLines = inlineContent ? [inlineContent] : [];
    } else if (current) {
      contentLines.push(line);
    } else if (line.trim()) {
      throw new Error("Text before the first airport label: " + line.trim());
    }
  }

  flush();
  if (blocks.length === 0) throw new Error("No recognized airport labels found.");
  return blocks;
}

const normalizeIcao = (value: string) => value.toUpperCase();

export function parseNotamPaste(input: string): NotamPasteBlock[] {
  return splitBlocks<NotamPasteBlock>(input, (line) => {
    const main = line.match(/^notam_(dep|arr)\s*\(([A-Z0-9]{3,4})\)\s*:/i);
    if (main) {
      return { scope: main[1].toLowerCase() as "dep" | "arr", icao: normalizeIcao(main[2]) };
    }
    const other = line.match(/^(alt|toff_alt|takeoff_alt|enroute_alt|enroute)\s*\(?([A-Z0-9]{3,4})\)?\s*:/i);
    if (other) {
      const label = other[1].toLowerCase();
      const scope = label === "takeoff_alt" ? "toff_alt" : label as NotamPasteScope;
      return { scope, icao: normalizeIcao(other[2]) };
    }
    return null;
  });
}

export function parseWxPaste(input: string): WxPasteBlock[] {
  return splitBlocks<WxPasteBlock>(input, (line) => {
    const match = line.match(/^(metar|taf)_(dep|arr|alt|toff_alt|takeoff_alt|enroute_alt|enroute)\s*\(?([A-Z0-9]{3,4})\)?\s*:/i);
    if (!match) return null;
    const label = match[2].toLowerCase();
    const scope = label === "takeoff_alt" ? "toff_alt" : label as NotamPasteScope;
    return {
      field: match[1].toLowerCase() as "metar" | "taf",
      scope,
      icao: normalizeIcao(match[3]),
    };
  });
}
