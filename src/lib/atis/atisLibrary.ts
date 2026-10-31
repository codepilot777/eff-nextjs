import { parseAtisPaste } from './atisTemplate';

export interface AtisLibraryEntry {
  icao?: unknown;
  type?: unknown;
  ident?: unknown;
  content?: unknown;
  active?: unknown;
}

export function atisEntryKey(entry: AtisLibraryEntry): string {
  const ident = entry.ident || (typeof entry.content === 'string' ? parseAtisPaste(entry.content)?.ident : '') || '';
  return `${entry.icao}-${entry.type}-${ident}`;
}

function sameStation(a: AtisLibraryEntry, b: AtisLibraryEntry) {
  return a.icao === b.icao && a.type === b.type;
}

export function getActiveAtis<T extends AtisLibraryEntry>(library: T[], icao: unknown, type: unknown): T | undefined {
  const entries = library.filter((entry) => entry.icao === icao && entry.type === type);
  // Old lessons have no active flag: their first (formerly only) bulletin stays active.
  return entries.find((entry) => entry.active === true)
    ?? (entries.every((entry) => entry.active === undefined) ? entries[0] : undefined);
}

export function setActiveAtis<T extends AtisLibraryEntry>(library: T[], selected: T): T[] {
  return library.map((entry) => sameStation(entry, selected)
    ? { ...entry, active: atisEntryKey(entry) === atisEntryKey(selected) }
    : entry);
}

export function saveAtisEntry<T extends AtisLibraryEntry>(library: T[], entry: T, editingKey: string | null = null): T[] {
  const active = getActiveAtis(library, entry.icao, entry.type);
  const key = atisEntryKey(entry);
  const isActive = active ? atisEntryKey(active) === key || atisEntryKey(active) === editingKey :
    !library.some((item) => sameStation(item, entry));
  const remaining = library.filter((item) => atisEntryKey(item) !== key && atisEntryKey(item) !== editingKey)
    .map((item) => sameStation(item, entry) ? { ...item, active: item === active && !isActive } : item);
  return [...remaining, { ...entry, active: isActive }];
}

export function deleteAtisEntry<T extends AtisLibraryEntry>(library: T[], entry: T): T[] {
  const active = getActiveAtis(library, entry.icao, entry.type);
  return library.filter((item) => atisEntryKey(item) !== atisEntryKey(entry))
    .map((item) => sameStation(item, entry) ? { ...item, active: item === active } : item);
}
