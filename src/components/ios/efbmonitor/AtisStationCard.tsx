"use client";

import { useState } from 'react';
import { atisEntryKey, getActiveAtis } from '@/lib/atis/atisLibrary';
import { parseAtisPaste } from '@/lib/atis/atisTemplate';

interface Bulletin {
  icao: string;
  type: string;
  ident?: string;
  issued_at?: string | null;
  content?: string;
  body?: string;
  active?: boolean;
}

function bulletinLabel(entry: Bulletin) {
  const parsed = parseAtisPaste(entry.content || '');
  return [entry.ident || parsed?.ident || 'Legacy ATIS', entry.issued_at || parsed?.issuedAt].filter(Boolean).join(' · ');
}

export default function AtisStationCard({ entries, onActivate, onEdit, onDelete }: {
  entries: Bulletin[];
  onActivate: (entry: Bulletin) => void;
  onEdit: (entry: Bulletin) => void;
  onDelete: (entry: Bulletin) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const station = entries[0];
  const active = getActiveAtis(entries, station.icao, station.type);
  const selected = entries.find((entry) => atisEntryKey(entry) === selectedKey) || active || station;
  const label = `${station.icao} ${station.type}`;

  return (
    <div className="bg-lido-950 border border-[#333333] rounded-lg p-3 min-w-0">
      <div className="flex flex-wrap justify-between gap-1 text-xs mb-2">
        <span className="text-status-teal font-bold">{label}</span>
        <span className={active ? 'text-status-teal' : 'text-[#FF9100]'}>
          {active ? `ACTIVE: ${bulletinLabel(active)}` : 'NO ACTIVE ATIS'}
        </span>
      </div>
      <div className="flex gap-2">
        <select aria-label={`${label} identifier`} value={atisEntryKey(selected)}
          onChange={(event) => setSelectedKey(event.target.value)}
          className="min-w-0 flex-1 bg-lido-800 border border-[#404040] rounded-lg px-2 py-1.5 text-xs text-white">
          {entries.map((entry) => (
            <option key={atisEntryKey(entry)} value={atisEntryKey(entry)}>
              {bulletinLabel(entry)}{entry === active ? ' · ACTIVE' : ''}
            </option>
          ))}
        </select>
        <button onClick={() => onActivate(selected)} disabled={selected === active}
          className="text-[0.65rem] px-3 py-1.5 rounded-lg bg-[#00bfa5]/20 text-status-teal disabled:opacity-40">
          SET ACTIVE
        </button>
      </div>
      <details className="mt-2 text-xs text-text-muted">
        <summary className="cursor-pointer">View content / edit</summary>
        <pre className="whitespace-pre-wrap break-words font-mono text-status-teal text-[0.65rem] my-3">{selected.content || selected.body}</pre>
        <div className="flex gap-2">
          <button onClick={() => onEdit(selected)} className="px-3 py-1 rounded bg-[#333] text-white">EDIT</button>
          <button onClick={() => onDelete(selected)} className="px-3 py-1 rounded bg-[#FF1744]/20 text-[#FF1744]">DELETE</button>
        </div>
      </details>
    </div>
  );
}
