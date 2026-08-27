import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainee Operating Procedures",
};

export default function Page() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Overpass:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />
      <style>{`
  :root {
    --paper: #EEF1F0;
    --card: #FFFFFF;
    --ink: #16232A;
    --ink-muted: #52646C;
    --ink-faint: #7C8B90;
    --accent: #0E7C7B;
    --accent-strong: #0A5D5C;
    --accent-wash: rgba(14, 124, 123, 0.09);
    --amber: #9A5300;
    --amber-wash: rgba(184, 108, 0, 0.10);
    --blue: #1D5FA8;
    --blue-wash: rgba(29, 95, 168, 0.09);
    --line: #CAD3D2;
    --line-soft: #DEE4E3;
    --shadow: 0 1px 2px rgba(22, 35, 42, 0.04), 0 8px 24px rgba(22, 35, 42, 0.06);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #0B1113;
      --card: #121B1D;
      --ink: #E6EEEE;
      --ink-muted: #93A6A9;
      --ink-faint: #61767A;
      --accent: #2DD4C7;
      --accent-strong: #6FE9DF;
      --accent-wash: rgba(45, 212, 199, 0.10);
      --amber: #FFB020;
      --amber-wash: rgba(255, 176, 32, 0.10);
      --blue: #6EA8E8;
      --blue-wash: rgba(110, 168, 232, 0.10);
      --line: #223032;
      --line-soft: #1A2628;
      --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 28px rgba(0,0,0,0.35);
    }
  }
  :root[data-theme="dark"] {
    --paper: #0B1113;
    --card: #121B1D;
    --ink: #E6EEEE;
    --ink-muted: #93A6A9;
    --ink-faint: #61767A;
    --accent: #2DD4C7;
    --accent-strong: #6FE9DF;
    --accent-wash: rgba(45, 212, 199, 0.10);
    --amber: #FFB020;
    --amber-wash: rgba(255, 176, 32, 0.10);
    --blue: #6EA8E8;
    --blue-wash: rgba(110, 168, 232, 0.10);
    --line: #223032;
    --line-soft: #1A2628;
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 28px rgba(0,0,0,0.35);
  }

  * { box-sizing: border-box; }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
    font-size: 15.5px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--accent-strong); }
  .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace; }

  .shell { max-width: 1220px; margin: 0 auto; padding: 0 32px 120px; }

  /* ---------- Masthead ---------- */
  .masthead { padding: 52px 0 36px; border-bottom: 1px solid var(--line); margin-bottom: 44px; }
  .eyebrow {
    font-family: "IBM Plex Mono", monospace; font-size: 12.5px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-strong);
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }
  .eyebrow::before {
    content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash); flex: none;
  }
  h1 {
    font-family: "Overpass", ui-sans-serif, sans-serif; font-weight: 800;
    font-size: clamp(2rem, 3.6vw, 2.8rem); line-height: 1.08; letter-spacing: -0.01em;
    margin: 0 0 14px; text-wrap: balance; max-width: 20ch;
  }
  .dek { font-size: 1.05rem; color: var(--ink-muted); max-width: 66ch; margin: 0 0 24px; text-wrap: pretty; }
  .docmeta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .docmeta span {
    font-family: "IBM Plex Mono", monospace; font-size: 11.5px; font-weight: 500;
    letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-muted);
    border: 1px solid var(--line); background: var(--card); border-radius: 5px; padding: 6px 10px;
  }
  .docmeta span.link a { color: var(--accent-strong); text-decoration: none; }
  .docmeta span.link a:hover { text-decoration: underline; }
  .docmeta b { color: var(--ink); font-weight: 600; }

  .scope-note {
    margin-top: 26px; display: flex; gap: 12px; padding: 14px 16px;
    background: var(--amber-wash); border: 1px solid color-mix(in srgb, var(--amber) 35%, var(--line));
    border-radius: 8px; font-size: 0.9rem; color: var(--ink); max-width: 70ch;
  }
  .scope-note .tag {
    font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); flex: none; padding-top: 2px;
  }

  /* ---------- Layout ---------- */
  .layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 56px; align-items: start; }
  .rail { position: sticky; top: 28px; display: flex; flex-direction: column; gap: 20px; padding-top: 6px; max-height: calc(100vh - 56px); overflow-y: auto; }
  .rail-group-label {
    font-family: "IBM Plex Mono", monospace; font-size: 10.5px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink-faint); margin-bottom: 8px;
  }
  .rail a {
    text-decoration: none; color: var(--ink-muted); font-family: "IBM Plex Mono", monospace;
    font-size: 12.5px; font-weight: 500; display: block; padding: 5px 0 5px 14px;
    border-left: 2px solid var(--line-soft); transition: color 0.15s ease, border-color 0.15s ease;
  }
  .rail a:hover { color: var(--ink); border-left-color: var(--ink-faint); }
  .rail a b { color: var(--ink-faint); font-weight: 500; margin-right: 6px; }

  .content { display: flex; flex-direction: column; min-width: 0; }

  /* ---------- Parts ---------- */
  .part { padding: 40px 0 8px; }
  .part:first-child { padding-top: 0; }
  .part-head {
    display: flex; align-items: baseline; gap: 14px; margin-bottom: 6px;
    padding-bottom: 14px; border-bottom: 2px solid var(--ink);
  }
  .part-letter {
    font-family: "Overpass", sans-serif; font-weight: 800; font-size: 1.6rem; color: var(--accent-strong);
    line-height: 1;
  }
  .part-head h2 { font-family: "Overpass", sans-serif; font-weight: 700; font-size: 1.5rem; margin: 0; }
  .part-dek { color: var(--ink-muted); font-size: 0.92rem; margin: 10px 0 0; max-width: 68ch; }

  /* ---------- Sections ---------- */
  .section { padding: 38px 0; border-bottom: 1px solid var(--line-soft); scroll-margin-top: 24px; }
  .section:last-child { border-bottom: none; }
  .section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
  .section-id {
    font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 0.85rem;
    color: var(--ink-faint); flex: none;
  }
  .section h3 { font-family: "Overpass", sans-serif; font-weight: 700; font-size: 1.25rem; margin: 0; }
  .section .sub { font-size: 0.92rem; color: var(--ink-muted); margin: 8px 0 22px; max-width: 66ch; }

  /* ---------- Field reference list ---------- */
  .fieldref { display: flex; flex-direction: column; margin: 0 0 20px; border-top: 1px solid var(--line-soft); }
  .fieldref .row { display: grid; grid-template-columns: minmax(140px, 220px) minmax(0, 1fr); gap: 18px; padding: 11px 0; border-bottom: 1px solid var(--line-soft); }
  .fieldref .field-name {
    font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 0.82rem;
    color: var(--accent-strong); padding-top: 1px;
  }
  .fieldref .field-desc { font-size: 0.9rem; color: var(--ink); }
  .fieldref .field-desc .opt { color: var(--ink-faint); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; margin-left: 6px; }
  @media (max-width: 640px) {
    .fieldref .row { grid-template-columns: 1fr; gap: 4px; }
  }

  /* ---------- Action steps ---------- */
  .steps { display: flex; flex-direction: column; gap: 12px; margin: 0 0 20px; }
  .steps .step { display: flex; gap: 12px; align-items: flex-start; }
  .steps .step .n {
    flex: none; width: 22px; height: 22px; border-radius: 5px; background: var(--accent-wash);
    color: var(--accent-strong); font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 0.78rem;
    display: flex; align-items: center; justify-content: center; margin-top: 1px;
  }
  .steps .step p { margin: 0; font-size: 0.92rem; }
  .steps .step b.mono { font-weight: 600; }

  p { font-size: 0.92rem; margin: 0 0 14px; }
  .field { font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 0.86em; background: var(--accent-wash); color: var(--accent-strong); padding: 1px 6px; border-radius: 4px; white-space: nowrap; }
  .btn-ref { font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 0.86em; }

  .pill { display: inline-flex; align-items: center; font-family: "IBM Plex Mono", monospace; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
  .pill.green { background: rgba(0,196,140,0.14); color: #0C8F63; border: 1px solid rgba(0,196,140,0.4); }
  .pill.amber { background: var(--amber-wash); color: var(--amber); border: 1px solid color-mix(in srgb, var(--amber) 40%, var(--line)); }
  .pill.red { background: rgba(220,50,50,0.10); color: #C23434; border: 1px solid rgba(220,50,50,0.35); }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .pill.green { color: #4FE3B0; }
    :root:not([data-theme="light"]) .pill.red { color: #FF6B6B; }
  }
  :root[data-theme="dark"] .pill.green { color: #4FE3B0; }
  :root[data-theme="dark"] .pill.red { color: #FF6B6B; }

  .callout { display: flex; gap: 10px; font-size: 0.87rem; padding: 12px 14px; border-radius: 8px; margin: 4px 0 18px; max-width: 72ch; }
  .callout.tip { background: var(--accent-wash); border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--line)); }
  .callout.warn { background: var(--amber-wash); border: 1px solid color-mix(in srgb, var(--amber) 35%, var(--line)); }
  .callout.note { background: var(--blue-wash); border: 1px solid color-mix(in srgb, var(--blue) 30%, var(--line)); }
  .callout .tag { font-family: "IBM Plex Mono", monospace; font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; flex: none; }
  .callout.tip .tag { color: var(--accent-strong); }
  .callout.warn .tag { color: var(--amber); }
  .callout.note .tag { color: var(--blue); }

  figure.shot {
    margin: 8px 0 4px; background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    overflow: hidden; box-shadow: var(--shadow); max-width: 640px;
  }
  figure.shot.wide { max-width: 100%; }
  figure.shot img { display: block; width: 100%; height: auto; border-bottom: 1px solid var(--line); }
  figure.shot figcaption {
    font-family: "IBM Plex Mono", monospace; font-size: 10.5px; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--ink-faint); padding: 9px 12px;
  }

  .two-col { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 28px; align-items: start; }
  @media (max-width: 860px) { .two-col { grid-template-columns: 1fr; } }

  .shot-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 640px) { .shot-pair { grid-template-columns: 1fr; } }

  .subcards { display: flex; flex-direction: column; gap: 16px; margin: 4px 0 8px; }
  .subcard { border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; background: var(--card); }
  .subcard h4 { font-family: "Overpass", sans-serif; font-size: 0.95rem; margin: 0 0 6px; display: flex; gap: 8px; align-items: baseline; }
  .subcard h4 .k { font-family: "IBM Plex Mono", monospace; font-size: 0.72rem; color: var(--ink-faint); }
  .subcard p { margin: 0; font-size: 0.86rem; color: var(--ink-muted); }

  .closing { margin-top: 8px; padding: 36px 0 0; max-width: 68ch; }
  .closing h3 { font-family: "Overpass", sans-serif; font-size: 1.05rem; margin: 0 0 10px; }
  .closing p { color: var(--ink-muted); }

  @media (max-width: 860px) {
    .layout { grid-template-columns: 1fr; }
    .rail { display: none; }
    .shell { padding: 0 18px 90px; }
  }
`}</style>
<div className="shell">

  <header className="masthead">
    <div className="eyebrow">Electronic Flight Folder — Training Mock Up</div>
    <h1>Trainee Operating Procedures</h1>
    <p className="dek">The full field-by-field reference for the trainee EFB — every card on the Dashboard, every modal it opens, and what each one actually does.</p>
    <div className="docmeta">
      <span>Role: <b>Trainee</b></span>
      <span>Rev: <b>1.0</b></span>
      <span className="link">See also: <a href="/guides/trainee-quickstart">Trainee Quick Start</a></span>
    </div>
    <div className="scope-note">
      <span className="tag">Scope</span>
      <span>Covers everything reachable from <b>Flight Selection</b> and the <b>Workspace</b> (Dashboard and the five bottom-nav tabs). For the instructor side, see the <a href="/guides/instructor-quickstart">Instructor Quick Start</a> and <a href="/guides/instructor-procedures">Operating Procedures</a>.</span>
    </div>
  </header>

  <div className="layout">
    <nav className="rail">
      <div>
        <div className="rail-group-label">Part A — Getting Started</div>
        <a href="#a1"><b>A1</b>Select &amp; Activate</a>
      </div>
      <div>
        <div className="rail-group-label">Part B — FMC &amp; ATS Column</div>
        <a href="#b1"><b>B1</b>FMC &amp; ATS</a>
        <a href="#b2"><b>B2</b>SNN &amp; DOCS</a>
        <a href="#b3"><b>B3</b>Crew</a>
      </div>
      <div>
        <div className="rail-group-label">Part C — Fuel &amp; Weight Column</div>
        <a href="#c1"><b>C1</b>Fuel &amp; Weight</a>
        <a href="#c2"><b>C2</b>Accept Final Fuel</a>
      </div>
      <div>
        <div className="rail-group-label">Part D — Loadsheet &amp; Airport Column</div>
        <a href="#d1"><b>D1</b>Loadsheet</a>
        <a href="#d2"><b>D2</b>NOTOC</a>
        <a href="#d3"><b>D3</b>Airports</a>
      </div>
      <div>
        <div className="rail-group-label">Part E — Refuel &amp; Aircraft Column</div>
        <a href="#e1"><b>E1</b>Refuelling</a>
        <a href="#e2"><b>E2</b>Aircraft &amp; Defects</a>
        <a href="#e3"><b>E3</b>Efficiency &amp; OTP</a>
      </div>
      <div>
        <div className="rail-group-label">Part F — Bottom Nav</div>
        <a href="#f1"><b>F1</b>Navlog</a>
        <a href="#f2"><b>F2</b>Weather</a>
        <a href="#f3"><b>F3</b>NOTAM</a>
        <a href="#f4"><b>F4</b>Communication</a>
        <a href="#f5"><b>F5</b>Tech Log</a>
      </div>
    </nav>

    <div className="content">

      
      <div className="part" id="part-a">
        <div className="part-head"><span className="part-letter">A</span><h2>Getting Started</h2></div>
        <p className="part-dek">Before the Dashboard: pick the flight, pick the OFP version, activate it.</p>

        <section className="section" id="a1">
          <div className="section-head"><span className="section-id">A1</span><h3>Select &amp; Activate a Flight</h3></div>
          <p className="sub"><span className="mono">/flight-select</span> — every flight the instructor has published, and every version they&apos;ve dispatched for it.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Available Flights</div><div className="field-desc">Left column. One entry per published flight.</div></div>
            <div className="row"><div className="field-name">OFP Versions</div><div className="field-desc">Every dispatched version for the selected flight, newest included — pick one to read its briefing.</div></div>
            <div className="row"><div className="field-name">Special Navigation Notes</div><div className="field-desc">The dispatcher&apos;s free-text remarks for the version you&apos;re currently viewing.</div></div>
            <div className="row"><div className="field-name">Compare</div><div className="field-desc">Appears only when you&apos;re viewing a version older than the latest — a field-by-field diff (Route, STD, STA, Fuel, ZFW, TOW, Alternates, Navlog) against what&apos;s actually current.</div></div>
            <div className="row"><div className="field-name">ACTIVATE Vn</div><div className="field-desc">Toggle. Makes the version you&apos;re viewing the one you&apos;re flying — this is what the instructor&apos;s Config tab and Inbox panel are both watching for.</div></div>
            <div className="row"><div className="field-name">VIEW</div><div className="field-desc">Opens the Workspace for this flight.</div></div>
          </div>
          <div className="callout tip"><span className="tag">Tip</span><span>Switching to a different OFP version here does not activate it by itself — the toggle is a separate, deliberate step.</span></div>
          <figure className="shot"><img src="/guides/trainee/flight-select.png" alt="Flight select screen with a flight chosen and V1 activated" /><figcaption>EFB Flight Selection</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-b">
        <div className="part-head"><span className="part-letter">B</span><h2>FMC &amp; ATS Column</h2></div>
        <p className="part-dek">The leftmost Dashboard column: route and performance reference numbers, briefing text, and the crew roster.</p>

        <section className="section" id="b1">
          <div className="section-head"><span className="section-id">B1</span><h3>FMC &amp; ATS</h3></div>
          <p className="sub">Tap the card for the full FMS &amp; ATS Data Preview — reference numbers plus the ICAO flight plan telex.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Aircraft Type / Reg</div><div className="field-desc">Airframe flying this session.</div></div>
            <div className="row"><div className="field-name">Drag/F-F Factor</div><div className="field-desc">Airframe-specific drag and fuel-flow correction factors.</div></div>
            <div className="row"><div className="field-name">MEL/CDL Pen</div><div className="field-desc">Fuel penalty from any active MEL/CDL items.</div></div>
            <div className="row"><div className="field-name">FMS Route / Total Distance</div><div className="field-desc">The full route string and its ground distance.</div></div>
            <div className="row"><div className="field-name">TOC / TOC Temp</div><div className="field-desc">Top-of-climb altitude and temperature.</div></div>
            <div className="row"><div className="field-name">Cruise Schedule</div><div className="field-desc">Cost index the OFP was planned at.</div></div>
            <div className="row"><div className="field-name">EDTO Flight</div><div className="field-desc">Whether this sector requires Extended Diversion Time Operations.</div></div>
            <div className="row"><div className="field-name">Reserve / Min Divert Fuel</div><div className="field-desc">Final reserve fuel, and the minimum fuel to divert to the nominated field.</div></div>
            <div className="row"><div className="field-name">Avg Wind / Avg Trip</div><div className="field-desc">Average enroute wind component and average trip fuel burn rate.</div></div>
            <div className="row"><div className="field-name">Highest Trip MRA / EDG MRA</div><div className="field-desc">Highest minimum reception altitude on the route, and its en-route diversion-grid equivalent — flagged when unusually high.</div></div>
            <div className="row"><div className="field-name">Dep Rwy / SID · Arr Rwy / STAR</div><div className="field-desc">Planned departure and arrival runway plus procedure.</div></div>
          </div>
          <p>In the modal, <span className="field">ICAO ATS Flight Plan</span> shows the actual FPL telex text. <b className="mono">📤 Share Route</b> copies/shares it to another device. <b className="mono">Highlight Route</b> steps through the route token-by-token (SID → waypoints → STAR) — tap repeatedly to advance, one token highlighted at a time; <b className="mono">✕ Clear Highlight</b> resets it.</p>
          <figure className="shot"><img src="/guides/trainee/col-fmc.png" alt="FMC and ATS card, SNN/DOCS buttons and Crew card" /><figcaption>FMC &amp; ATS Column</figcaption></figure>
          <figure className="shot wide" style={{marginTop: '20px'}}><img src="/guides/trainee/fms.png" alt="FMS and ATS Data Preview modal" /><figcaption>FMS &amp; ATS Data Preview</figcaption></figure>
        </section>

        <section className="section" id="b2">
          <div className="section-head"><span className="section-id">B2</span><h3>SNN &amp; DOCS</h3></div>
          <p className="sub">Two buttons under the FMC &amp; ATS card, both read-only.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">SNN</div><div className="field-desc">Special Navigation Note — the dispatcher&apos;s active remarks, same text as on the flight-select screen.</div></div>
            <div className="row"><div className="field-name">DOCS</div><div className="field-desc">The full Operational Flight Plan telex text.</div></div>
          </div>
          <div className="shot-pair">
            <figure className="shot"><img src="/guides/trainee/snn.png" alt="Special Navigation Note modal" /><figcaption>Special Navigation Note</figcaption></figure>
            <figure className="shot"><img src="/guides/trainee/docs.png" alt="Operational Flight Plan modal" /><figcaption>Operational Flight Plan (DOCS)</figcaption></figure>
          </div>
        </section>

        <section className="section" id="b3">
          <div className="section-head"><span className="section-id">B3</span><h3>Crew</h3></div>
          <p className="sub">The full roster behind the card&apos;s name preview.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Flight Deck</div><div className="field-desc">Commander plus first officer(s) — up to 4 name slots for augmented long-haul crews.</div></div>
            <div className="row"><div className="field-name">Cabin Crew</div><div className="field-desc">Full cabin crew list. The first name is always the Chief Cabin Crew, ranked <span className="mono">U-IM</span>.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/crew.png" alt="Crew Roster modal" /><figcaption>Crew Roster</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-c">
        <div className="part-head"><span className="part-letter">C</span><h2>Fuel &amp; Weight Column</h2></div>
        <p className="part-dek">The fuel table and the weight chain (ZFW → TOW → LW) — where you revise numbers against the OFP baseline.</p>

        <section className="section" id="c1">
          <div className="section-head"><span className="section-id">C1</span><h3>Fuel &amp; Weight</h3></div>
          <p className="sub">A single card, no separate modal — every row is live and editable here.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">AUTO / MANUAL</div><div className="field-desc">Toggle at the top. AUTO derives revised fuel from the aircraft&apos;s live state; MANUAL lets you key figures in directly.</div></div>
            <div className="row"><div className="field-name">Taxi / Trip Fuel / Cont / Alternate / Reserve</div><div className="field-desc">Each row shows OFP planned vs. your Revised figure, with a running time column.</div></div>
            <div className="row"><div className="field-name">Fuel Reqd / Total Fuel</div><div className="field-desc">Bold subtotal and grand total rows.</div></div>
            <div className="row"><div className="field-name">ZFW</div><div className="field-desc">The one figure you must key in yourself — the OFP figure is shown for reference, but the Revised box starts blank. This is what unlocks C2.</div></div>
            <div className="row"><div className="field-name">TOW / LW</div><div className="field-desc">Computed from your ZFW and fuel entries, each with a margin against limits.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/col-fuel.png" alt="Fuel and Weight card with fuel table and ZFW/TOW/LW rows" /><figcaption>Fuel &amp; Weight Column</figcaption></figure>
        </section>

        <section className="section" id="c2">
          <div className="section-head"><span className="section-id">C2</span><h3>Accept Final Fuel</h3></div>
          <p className="sub">Once a Revised ZFW is entered, a <span className="field">Pending fuel</span> banner appears above the fuel table — tap it.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Final Fuel</div><div className="field-desc">The total figure you&apos;re about to accept.</div></div>
            <div className="row"><div className="field-name">Log Fuel</div><div className="field-desc">Fuel currently logged onboard before uplift.</div></div>
            <div className="row"><div className="field-name">Expected Uplift</div><div className="field-desc">Final Fuel minus Log Fuel — what the tender needs to deliver.</div></div>
            <div className="row"><div className="field-name">Tank diagram</div><div className="field-desc">Left / Center / Right main tank distribution.</div></div>
            <div className="row"><div className="field-name">Standard / Non-Standard</div><div className="field-desc">Whether the tank distribution follows the aircraft&apos;s standard fuel policy.</div></div>
            <div className="row"><div className="field-name">Send Final Fuel Figures To</div><div className="field-desc"><span className="field">Load Control</span> and <span className="field">Fuel Company</span> — each independently Include/Exclude.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/accept-fuel.png" alt="Accept Final Fuel Figures modal" /><figcaption>Accept Final Fuel Figures</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-d">
        <div className="part-head"><span className="part-letter">D</span><h2>Loadsheet &amp; Airport Column</h2></div>
        <p className="part-dek">Three cards: the loadsheet itself, the dangerous-goods manifest, and airport/weather-limit data.</p>

        <section className="section" id="d1">
          <div className="section-head"><span className="section-id">D1</span><h3>Loadsheet</h3></div>
          <p className="sub">Tap the card for the full breakdown behind the CREW/PAX/ZFW summary.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">PRELIM / FINAL badge</div><div className="field-desc">Which document type and version you&apos;re looking at.</div></div>
            <div className="row"><div className="field-name">Weights &amp; Fuel</div><div className="field-desc">Trip/Contingency/Alternate/Reserve/Min Reqd/Extra fuel, Total Block, then Zero Fuel/Takeoff/Landing weights.</div></div>
            <div className="row"><div className="field-name">Weight Limit</div><div className="field-desc"><span className="mono">SYS</span>/<span className="mono">CUST</span> toggle for system vs. custom limits; <span className="field">Desired Fuel</span> policy; MTOW/MZFW/MLAW with LW Margin.</div></div>
            <div className="row"><div className="field-name">EZFW Datasheet</div><div className="field-desc">The early-ZFW figures dispatched before the final loadsheet.</div></div>
          </div>
          <div className="callout warn"><span className="tag">Note</span><span>If a figure looks wrong, reject it instead of signing — the loadsheet and fuel-receipt reject flows both work the same way: state a reason, and the instructor gets notified to resend a corrected version.</span></div>
          <figure className="shot"><img src="/guides/trainee/col-loadsheet.png" alt="Loadsheet, NOTOC and Airport cards" /><figcaption>Loadsheet &amp; Airport Column</figcaption></figure>
          <div className="shot-pair" style={{marginTop: '20px'}}>
            <figure className="shot"><img src="/guides/trainee/loadsheet.png" alt="Loadsheet and Payload Detail modal" /><figcaption>Loadsheet &amp; Payload Detail</figcaption></figure>
            <figure className="shot"><img src="/guides/trainee/reject.png" alt="Reject flow modal" /><figcaption>Reject (Loadsheet / Fuel Receipt)</figcaption></figure>
          </div>
        </section>

        <section className="section" id="d2">
          <div className="section-head"><span className="section-id">D2</span><h3>NOTOC</h3></div>
          <p className="sub">Dangerous goods, if any, loaded on this sector.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">IMP code preview</div><div className="field-desc">The card itself shows just the cargo-handling code(s) — <span className="mono">Nil DG</span> if the flight is clean.</div></div>
            <div className="row"><div className="field-name">Manifest</div><div className="field-desc">In the modal: Station of Unloading, AWB, UN/ID No., Proper Shipping Name, Class/Div, Net Quantity, Radioactive Categ., PG, Emergency Phone.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/notoc.png" alt="Notification to Captain (NOTOC) modal" /><figcaption>Notification to Captain (NOTOC)</figcaption></figure>
        </section>

        <section className="section" id="d3">
          <div className="section-head"><span className="section-id">D3</span><h3>Airports</h3></div>
          <p className="sub">A weather-limits analysis table — departure, arrival, and each alternate, side by side.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">MDF Delta / MTR / Dis</div><div className="field-desc">Minimum divert fuel delta, minimum time to return, and distance.</div></div>
            <div className="row"><div className="field-name">FL / MORA</div><div className="field-desc">Planned level against minimum off-route altitude.</div></div>
            <div className="row"><div className="field-name">Ceil / Vis Reqd vs Fcst</div><div className="field-desc">Required ceiling and visibility minimums against the forecast for the From/Till window.</div></div>
            <div className="row"><div className="field-name">H/T WC · XWC</div><div className="field-desc">Head/tailwind component and crosswind component.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/airports.png" alt="Airports modal weather limits table" /><figcaption>Airports</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-e">
        <div className="part-head"><span className="part-letter">E</span><h2>Refuel &amp; Aircraft Column</h2></div>
        <p className="part-dek">The rightmost column: fuel delivery, aircraft acceptance, defects, and on-time performance.</p>

        <section className="section" id="e1">
          <div className="section-head"><span className="section-id">E1</span><h3>Refuelling</h3></div>
          <p className="sub">Tracks the physical fuel delivery, separate from the figures you accepted in C2.</p>
          <div className="steps">
            <div className="step"><span className="n">1</span><p><span className="field">Standby … Sent</span> — before any uplift request, the standby fuel figure has been sent to the tender.</p></div>
            <div className="step"><span className="n">2</span><p><span className="field">Refuelling…</span> — the request is in progress.</p></div>
            <div className="step"><span className="n">3</span><p><span className="field">Refuelling Complete</span> — tap to open the receipt: Supplier Code, Product, Date, Specific Gravity, Uplifted and Total FOB. <b className="mono">Accept Fuel Receipt</b> or <b className="mono">Reject</b>.</p></div>
            <div className="step"><span className="n">4</span><p><span className="field">Refuel Accepted</span> — stays tappable afterward so you can re-open the receipt at any time.</p></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/col-refuel.png" alt="Refuel and Aircraft column" /><figcaption>Refuel &amp; Aircraft Column</figcaption></figure>
          <figure className="shot wide" style={{marginTop: '20px'}}><img src="/guides/trainee/refuelling.png" alt="Refuelling Order and Receipt modal" /><figcaption>Refuelling Order &amp; Receipt</figcaption></figure>
        </section>

        <section className="section" id="e2">
          <div className="section-head"><span className="section-id">E2</span><h3>Aircraft &amp; Defects</h3></div>
          <p className="sub">The Aircraft card mixes a quick status banner with two inline fields and a link to full defect detail.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Status banner</div><div className="field-desc"><span className="pill amber">Techlog Pending</span> → <span className="pill amber">Techlog Released</span> (tap to jump to Tech Log) → <span className="pill green">Aircraft Accepted</span>.</div></div>
            <div className="row"><div className="field-name">Inbound / ETA / Bay</div><div className="field-desc">Reference only.</div></div>
            <div className="row"><div className="field-name">Log Fuel</div><div className="field-desc">Editable inline — current fuel onboard, independent of the Fuel &amp; Weight column.</div></div>
            <div className="row"><div className="field-name">Estimated / Actual Uplift</div><div className="field-desc">Estimated until a real fuel receipt is sent, then switches to the real figure.</div></div>
            <div className="row"><div className="field-name">Defect (PADD/SADD/ADD)</div><div className="field-desc">Counts only — tap the card for the itemised list.</div></div>
          </div>
          <p>In the <span className="field">Aircraft Defects</span> modal, each category (PADD / SADD / ADD) lists its items with an ID, ATA chapter, status badge (<span className="pill red">Open</span> / <span className="pill amber">Deferred</span> / <span className="pill green">Cleared</span>), description, and MEL reference where applicable.</p>
          <figure className="shot"><img src="/guides/trainee/defects.png" alt="Aircraft Defects modal with PADD, SADD, ADD" /><figcaption>Aircraft Defects (PADD / SADD / ADD)</figcaption></figure>
        </section>

        <section className="section" id="e3">
          <div className="section-head"><span className="section-id">E3</span><h3>Efficiency &amp; OTP</h3></div>
          <p className="sub">Two read-only reference cards at the bottom of the column — no modal.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Efficiency</div><div className="field-desc">Average Taxi Out, Overburn and Holding times as dials.</div></div>
            <div className="row"><div className="field-name">OTP</div><div className="field-desc">OUT/OFF/ON/IN timeline in Z and local time, each leg&apos;s delay against schedule, with both stations&apos; UTC offsets footnoted.</div></div>
          </div>
        </section>
      </div>

      
      <div className="part" id="part-f">
        <div className="part-head"><span className="part-letter">F</span><h2>Bottom Nav</h2></div>
        <p className="part-dek">The five tabs alongside Dashboard, always available at the bottom of the Workspace.</p>

        <section className="section" id="f1">
          <div className="section-head"><span className="section-id">F1</span><h3>Navlog</h3></div>
          <p className="sub">Waypoint-by-waypoint reference — read-only.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">FL / MORA</div><div className="field-desc">Planned level and minimum off-route altitude at each fix.</div></div>
            <div className="row"><div className="field-name">MTR / Dis / GS</div><div className="field-desc">Magnetic track, leg distance, ground speed.</div></div>
            <div className="row"><div className="field-name">Lat/Long · Wind/Weight</div><div className="field-desc">Position and the wind/weight assumptions used for that leg.</div></div>
            <div className="row"><div className="field-name">Req Fuel / Actual · Time / ATA</div><div className="field-desc">Planned vs. actual fuel remaining and time, editable as the flight progresses.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/navlog.png" alt="Navlog waypoint table" /><figcaption>Navlog</figcaption></figure>
        </section>

        <section className="section" id="f2">
          <div className="section-head"><span className="section-id">F2</span><h3>Weather</h3></div>
          <p className="sub">METAR/TAF, one card per airport.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Departure / Arrival / Alternate</div><div className="field-desc">Each gets its own METAR and TAF box.</div></div>
            <div className="row"><div className="field-name">Enroute Alternate / Stations</div><div className="field-desc">Shown only where relevant (ETOPS/EDTO sectors) — collapsed behind a count when there are many.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/weather.png" alt="Weather Briefing with METAR and TAF per airport" /><figcaption>Weather Briefing</figcaption></figure>
        </section>

        <section className="section" id="f3">
          <div className="section-head"><span className="section-id">F3</span><h3>NOTAM</h3></div>
          <p className="sub">Same layout as Weather.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Per-airport card</div><div className="field-desc">Departure expanded by default; tap any airport row to expand or collapse it.</div></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/notam.png" alt="NOTAM Briefing per airport" /><figcaption>NOTAM Briefing</figcaption></figure>
        </section>

        <section className="section" id="f4">
          <div className="section-head"><span className="section-id">F4</span><h3>Communication</h3></div>
          <p className="sub">ACARS, PDC and ATIS in one tab.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">ACARS</div><div className="field-desc">Free-text company messages, left panel.</div></div>
            <div className="row"><div className="field-name">Request PDC</div><div className="field-desc">Dep / Arr / Facility / Flight No. / ATIS Ident / Gate → <b className="mono">SEND PDC REQ</b> → response lands in the Clearance Inbox.</div></div>
            <div className="row"><div className="field-name">Request ATIS</div><div className="field-desc">Airport + Type (Departure/Arrival) → <b className="mono">SEND ATIS REQ</b> → response lands in the ATIS Inbox.</div></div>
          </div>
          <div className="callout note"><span className="tag">Note</span><span>If the instructor has pre-loaded an ATIS for that airport/type, it arrives almost immediately; otherwise expect a &quot;not available&quot; fallback after about 15 seconds.</span></div>
          <figure className="shot"><img src="/guides/trainee/comms.png" alt="Communication tab with ACARS, Request PDC and Request ATIS" /><figcaption>Communication</figcaption></figure>
        </section>

        <section className="section" id="f5">
          <div className="section-head"><span className="section-id">F5</span><h3>Tech Log</h3></div>
          <p className="sub">The same E-Techlog the instructor can open in Engineer mode — here in Flight Crew mode.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Fluids / Checks / Defects / Release / Acceptance</div><div className="field-desc">Track across the top of the aircraft&apos;s servicing state.</div></div>
            <div className="row"><div className="field-name">Pending Actions</div><div className="field-desc">The next task to complete — typically <b className="mono">PREPARE FLIGHT</b>.</div></div>
          </div>
          <div className="steps">
            <div className="step"><span className="n">1</span><p>Open <b className="mono">PREPARE FLIGHT</b> from Pending Actions.</p></div>
            <div className="step"><span className="n">2</span><p>Confirm Flight Number, Origin/Destination Station, Flight Type (Revenue/Non-Revenue/Ferry), Commander and Galaxy ID.</p></div>
            <div className="step"><span className="n">3</span><p><b className="mono">CONFIRM &amp; PROCEED</b> accepts the aircraft — this is exactly what the instructor&apos;s &quot;Aircraft Accepted&quot; status is watching for.</p></div>
          </div>
          <figure className="shot"><img src="/guides/trainee/techlog.png" alt="Prepare Flight acceptance task in the Tech Log" /><figcaption>Tech Log · Prepare Flight</figcaption></figure>
        </section>
      </div>

    </div>
  </div>

  <div className="closing">
    <h3>That&apos;s every control</h3>
    <p>For the fast version of this same flow, see the <a href="/guides/trainee-quickstart">Trainee Quick Start</a>. Everything here is training data only — nothing in this app is fit for operational use.</p>
  </div>

</div>
    </>
  );
}
