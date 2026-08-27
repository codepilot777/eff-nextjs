import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instructor Operating Procedures",
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

  /* ---------- Action steps (numbered, matches on-screen button numbers) ---------- */
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

  /* status pill, mirrors app badges */
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

  /* screenshot figure */
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

  /* compact card list for lighter-treatment sections (Part C) */
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

  .return-link {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 24px;
    font-family: "IBM Plex Mono", monospace; font-size: 12px; font-weight: 500;
    letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-muted);
    text-decoration: none; transition: color 0.15s ease;
  }
  .return-link:hover { color: var(--accent-strong); }
`}</style>
<div className="shell">

  <Link href="/" className="return-link">← Return to Home</Link>

  <header className="masthead">
    <div className="eyebrow">Electronic Flight Folder — Training Mock Up</div>
    <h1>Instructor Operating Procedures</h1>
    <p className="dek">The full field-by-field reference for the Instructor Hub and the IOS Panel — every input, every button, and what it actually does to the trainee&apos;s EFB.</p>
    <div className="docmeta">
      <span>Role: <b>Instructor</b></span>
      <span>Rev: <b>1.0</b></span>
      <span className="link">See also: <a href="/guides/instructor-quickstart">Instructor Quick Start</a></span>
    </div>
    <div className="scope-note">
      <span className="tag">Scope</span>
      <span>Covers everything reachable from the <b>Instructor Hub</b> and the <b>IOS Panel</b>. For the trainee EFB, see the <a href="/guides/trainee-quickstart">Trainee Quick Start</a> and <a href="/guides/trainee-procedures">Operating Procedures</a>.</span>
    </div>
  </header>

  <div className="layout">
    <nav className="rail">
      <div>
        <div className="rail-group-label">Part A — Session Setup</div>
        <a href="#a1"><b>A1</b>Sign In</a>
        <a href="#a2"><b>A2</b>Create &amp; Dispatch</a>
        <a href="#a3"><b>A3</b>File on SimBrief</a>
        <a href="#a4"><b>A4</b>Manage Sessions</a>
      </div>
      <div>
        <div className="rail-group-label">Part B — EFB Monitor</div>
        <a href="#b1"><b>B1</b>Inbox &amp; Telemetry</a>
        <a href="#b2"><b>B2</b>Config</a>
        <a href="#b3"><b>B3</b>Payload</a>
        <a href="#b4"><b>B4</b>WX</a>
        <a href="#b5"><b>B5</b>NOTAMs</a>
        <a href="#b6"><b>B6</b>NOTOC</a>
      </div>
      <div>
        <div className="rail-group-label">Part C — Other Modules</div>
        <a href="#c1"><b>C1</b>E-Techlog</a>
        <a href="#c2"><b>C2</b>Sim Control</a>
      </div>
    </nav>

    <div className="content">

      
      <div className="part" id="part-a">
        <div className="part-head"><span className="part-letter">A</span><h2>Session Setup</h2></div>
        <p className="part-dek">Everything on the Instructor Hub (<span className="mono">/instructor</span>): signing in, filing a flight, and keeping track of the sessions you&apos;ve created.</p>

        <section className="section" id="a1">
          <div className="section-head"><span className="section-id">A1</span><h3>Sign In</h3></div>
          <p className="sub">Shared password gate for the whole Instructor Hub and every instructor-only action.</p>
          <div className="two-col">
            <div>
              <div className="fieldref">
                <div className="row"><div className="field-name">Name</div><div className="field-desc">A label only — tags which sessions you created (used to filter &quot;Your Simulator Sessions&quot;), and is remembered on this browser for next time.</div></div>
                <div className="row"><div className="field-name">Password</div><div className="field-desc">The one shared instructor password configured for this training environment.</div></div>
              </div>
              <div className="callout tip"><span className="tag">Tip</span><span>Sign in with the name <span className="mono">admin</span> to see every instructor&apos;s sessions on the hub, not just sessions you personally created.</span></div>
            </div>
            <figure className="shot"><img src="/guides/instructor/login.png" alt="Instructor login screen" /><figcaption>Instructor Login</figcaption></figure>
          </div>
        </section>

        <section className="section" id="a2">
          <div className="section-head"><span className="section-id">A2</span><h3>Create &amp; Dispatch a Flight</h3></div>
          <p className="sub">Set the route, file the OFP on SimBrief, then bring it back in and either hold it as a draft or publish it straight to the trainee.</p>

          <div className="fieldref">
            <div className="row"><div className="field-name">SimBrief Username</div><div className="field-desc">SimBrief account whose <b>most recently filed</b> OFP gets imported when you fetch/preview.</div></div>
            <div className="row"><div className="field-name">Flight Number</div><div className="field-desc">Parsed as &quot;AIRLINE NUM&quot; (e.g. <span className="mono">CPA 564</span>) — sets both the route SimBrief plans and the flight number shown throughout the session.</div></div>
            <div className="row"><div className="field-name">DEP ICAO / ARR ICAO</div><div className="field-desc">The route SimBrief will plan.</div></div>
            <div className="row"><div className="field-name">Commander Name</div><div className="field-desc">Shown on the trainee&apos;s Crew card.<span className="opt">optional</span> Auto-fills from SimBrief&apos;s captain once you preview, if left blank.</div></div>
            <div className="row"><div className="field-name">Crew FD / Crew CC</div><div className="field-desc">Flight deck / cabin crew headcount used to generate the crew roster.<span className="opt">optional</span> Defaults to 2 / 14 if left blank.</div></div>
            <div className="row"><div className="field-name">Generate Random NOTOC</div><div className="field-desc">Checkbox — spawns a randomized dangerous-goods manifest for a DG training exercise.</div></div>
          </div>

          <div className="steps">
            <div className="step"><span className="n">1</span><p><b className="btn-ref mono">OPEN SIMBRIEF &amp; GENERATE</b> opens simbrief.com&apos;s dispatch page in a new tab, pre-filled with this route, so you can actually file the OFP there — see <a href="#a3">A3</a> for what to check on that page.</p></div>
            <div className="step"><span className="n">2</span><p><b className="btn-ref mono">PREVIEW FLIGHT PLAN</b> pulls that OFP back in from SimBrief and shows the raw briefing text for review before you commit to anything.</p></div>
          </div>

          <p>From the review panel that opens: <b className="mono">SAVE AS DRAFT</b> stores the flight without the trainee seeing it, or <b className="mono">PUBLISH TO EFB</b> goes live immediately. <b className="mono">CANCEL</b> discards the preview.</p>

          <figure className="shot wide"><img src="/guides/instructor/create-flight.png" alt="Create new simulator flight form" /><figcaption>Create New Simulator Flight</figcaption></figure>
        </section>

        <section className="section" id="a3">
          <div className="section-head"><span className="section-id">A3</span><h3>File the OFP on SimBrief</h3></div>
          <p className="sub">What &quot;1 OPEN SIMBRIEF &amp; GENERATE&quot; actually opens — SimBrief&apos;s own dispatch page, pre-filled from the Create Flight form, before the OFP gets fetched back into A2.</p>

          <div className="fieldref">
            <div className="row"><div className="field-name">SimBrief Login</div><div className="field-desc"><span className="mono">effsimulator@gmail.com</span> / <span className="mono">effsimulator</span> — a shared account with no personal credentials on it, open for anyone running a session to use.</div></div>
          </div>
          <div className="callout warn"><span className="tag">Important</span><span>Always sign in to SimBrief with this account, even if you have your own Navigraph login — the EFF app&apos;s SimBrief fetch is tied to this specific account. Filing under a different one means EFF won&apos;t be able to fetch the flight plan back in A2.</span></div>

          <p><b>Flight Info / Aircraft Info / Selections</b></p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Airline, Flight Number, Depart, Arrive</div><div className="field-desc">Pre-filled automatically from the Create Flight form on the hub — no need to re-enter.</div></div>
            <div className="row"><div className="field-name">Alternate</div><div className="field-desc">Check this one manually — SimBrief auto-generates an alternate, but it isn&apos;t always suitable for the exercise. Set the desired alternate by hand.</div></div>
            <div className="row"><div className="field-name">Variant or Airframe</div><div className="field-desc">Select the airframe that matches the session&apos;s aircraft registration.</div></div>
            <div className="row"><div className="field-name">Climb Profile / Cruise Cost Index / Descent Profile</div><div className="field-desc">Already pre-set — no change required.</div></div>
            <div className="row"><div className="field-name">Selections</div><div className="field-desc">Pre-selected already. Just confirm <b>Alternates Count</b> is <span className="mono">4</span> — that&apos;s what opens up four alternate slots further down the page.</div></div>
          </div>
          <div className="callout note"><span className="tag">Note</span><span>The red &quot;Outdated AIRAC&quot; flag needs a paid SimBrief subscription to clear — not required for sim purposes.</span></div>
          <figure className="shot"><img src="/guides/instructor/simbrief-1.png" alt="SimBrief Flight Info, Aircraft Info and Selections cards" /><figcaption>SimBrief · Flight Info / Aircraft Info / Selections</figcaption></figure>

          <p><b>Optional Entries / Fuel Planning / Text Entries</b></p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Zero Fuel Weight</div><div className="field-desc">Set this yourself rather than leaving it on AUTO — everything else in Optional Entries, modify only as required.</div></div>
            <div className="row"><div className="field-name">Fuel Planning</div><div className="field-desc">All fields come pre-selected — modify only as required.</div></div>
            <div className="row"><div className="field-name">Captain Name</div><div className="field-desc">Change this manually to match the session&apos;s commander.</div></div>
            <div className="row"><div className="field-name">Dispatcher Remarks</div><div className="field-desc">SimBrief&apos;s equivalent of EFF&apos;s <b>Special Navigation Notes (SNN)</b> — enter as required.</div></div>
          </div>
          <figure className="shot"><img src="/guides/instructor/simbrief-2.png" alt="SimBrief Optional Entries, Fuel Planning and Text Entries cards" /><figcaption>SimBrief · Optional Entries / Fuel Planning / Text Entries</figcaption></figure>

          <p><b>Route</b></p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Selected Route</div><div className="field-desc">Auto-computed. Edit it directly, or pick one of the Suggested Routes below it, as required.</div></div>
          </div>
          <figure className="shot"><img src="/guides/instructor/simbrief-3.png" alt="SimBrief Route and Suggested Routes cards" /><figcaption>SimBrief · Route</figcaption></figure>

          <p><b>Alternate Airports / Enroute Stations</b></p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Alternate Airports (1–4)</div><div className="field-desc">Specify the actual four alternates for the exercise here. SimBrief nominates the runway in use automatically based on weather.</div></div>
            <div className="row"><div className="field-name">Enroute Stations</div><div className="field-desc">Add any airports along the route you want METAR/TAF coverage for, as required.</div></div>
          </div>
          <figure className="shot"><img src="/guides/instructor/simbrief-4.png" alt="SimBrief Alternate Airports and Enroute Stations cards" /><figcaption>SimBrief · Alternate Airports / Enroute Stations</figcaption></figure>

          <p><b>ETOPS Scenario / Historical Weather</b></p>
          <div className="fieldref">
            <div className="row"><div className="field-name">ETOPS Scenario</div><div className="field-desc">Defaults to 240 minutes. Enter ETOPS ERAs (Entry/Exit/Alternate airports) as required for the exercise.</div></div>
            <div className="row"><div className="field-name">Historical Weather</div><div className="field-desc">Requires Active Sky (AS16 / ASP4 / ASXP) and the SimBrief downloader to upload a weather snapshot — SimBrief then builds the OFP against that snapshot instead of its default weather.</div></div>
          </div>
          <figure className="shot"><img src="/guides/instructor/simbrief-5.png" alt="SimBrief ETOPS Scenario and Historical Weather cards" /><figcaption>SimBrief · ETOPS Scenario / Historical Weather</figcaption></figure>
        </section>

        <section className="section" id="a4">
          <div className="section-head"><span className="section-id">A4</span><h3>Manage Sessions</h3></div>
          <p className="sub">Every flight you create is a card on the hub, whether it&apos;s still a draft or already live.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">DRAFT / PUBLISHED</div><div className="field-desc">Status badge on each card. A <span className="pill amber">Draft</span> flight can be prepared quietly, then pushed live later — no need to recreate it.</div></div>
            <div className="row"><div className="field-name">IOS PANEL</div><div className="field-desc">Opens the live control panel for that session — see Part B.</div></div>
            <div className="row"><div className="field-name">PUBLISH</div><div className="field-desc">Draft cards only — flips the flight to <span className="pill green">Published</span>, visible to the trainee immediately.</div></div>
            <div className="row"><div className="field-name">🗑</div><div className="field-desc">Deletes the session.</div></div>
          </div>
          <div className="callout warn"><span className="tag">Caution</span><span>Delete has no confirmation prompt — it removes the session immediately.</span></div>
          <figure className="shot wide"><img src="/guides/instructor/sessions.png" alt="Session list with draft and published flights" /><figcaption>Your Simulator Sessions</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-b">
        <div className="part-head"><span className="part-letter">B</span><h2>EFB Monitor</h2></div>
        <p className="part-dek">The default module inside the IOS Panel (<span className="mono">IOS PANEL</span> on a session card) — a persistent Inbox column on the left, and five workflow tabs on the right that mirror the trainee&apos;s dispatch process.</p>

        <section className="section" id="b1">
          <div className="section-head"><span className="section-id">B1</span><h3>Inbox &amp; Telemetry</h3></div>
          <p className="sub">Stays visible on the left no matter which workflow tab is open on the right.</p>

          <p><b>Trainee Progress</b> — read-only status pulled live from the trainee&apos;s own actions, not something you set here:</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">Flight Plan</div><div className="field-desc">Which OFP version the trainee has actually <b>activated</b> in their EFB — not just the latest one you&apos;ve dispatched.</div></div>
            <div className="row"><div className="field-name">Aircraft Accepted</div><div className="field-desc">Whether the trainee has accepted the aircraft in the E-Techlog.</div></div>
            <div className="row"><div className="field-name">Final Fuel</div><div className="field-desc">Whether the trainee has accepted your dispatched fuel receipt, and at what ZFW.</div></div>
            <div className="row"><div className="field-name">Fuel Receipt</div><div className="field-desc">Pending → Sent (awaiting sign) → Accepted, or Rejected with the trainee&apos;s stated reason.</div></div>
            <div className="row"><div className="field-name">Loadsheet Status</div><div className="field-desc">No → Sent (Prelim) → Signed (Final), or Rejected with reason.</div></div>
            <div className="row"><div className="field-name">PDC Clearance</div><div className="field-desc">N/A until you&apos;ve approved a PDC request; then Pending / Accepted.</div></div>
          </div>

          <p><b>ATIS Library</b> — pre-load ATIS content per airport so the trainee&apos;s &quot;Send ATIS Req&quot; gets an instant response instead of a 15-second &quot;not available&quot; fallback:</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">ICAO / Type</div><div className="field-desc">Airport and DEPARTURE or ARRIVAL — entries are keyed by this pair, so saving again replaces the existing one for that airport+type.</div></div>
            <div className="row"><div className="field-name">Ident</div><div className="field-desc">The ATIS information letter (e.g. <span className="mono">C</span>) — header/footer text is generated automatically from this, you don&apos;t write it yourself.</div></div>
            <div className="row"><div className="field-name">✨ AI</div><div className="field-desc">Generates just the body content (runway, wind, QNH, remarks) for that airport/type from a prompt.</div></div>
            <div className="row"><div className="field-name">ADD TO LIBRARY</div><div className="field-desc">Saves the entry. EDIT / DEL on each existing entry below the list.</div></div>
          </div>

          <p><b>ACARS Chat Inbox</b> — a free-text box at the bottom to send an ad-hoc message straight to the trainee&apos;s ACARS, outside of any structured document.</p>

          <figure className="shot"><img src="/guides/instructor/inbox-panel.png" alt="Inbox and Telemetry panel" /><figcaption>Inbox &amp; Telemetry (persistent left column)</figcaption></figure>
        </section>

        <section className="section" id="b2">
          <div className="section-head"><span className="section-id">B2</span><h3>Config</h3></div>
          <p className="sub">Today&apos;s active OFP, and the path to dispatch a revised one mid-session.</p>
          <div className="fieldref">
            <div className="row"><div className="field-name">OFP Text</div><div className="field-desc">The briefing text for the version the trainee currently has active — the heading names that version explicitly, since it isn&apos;t always the latest one dispatched.</div></div>
            <div className="row"><div className="field-name">SimBrief Username</div><div className="field-desc">Which SimBrief account to pull the revision from.</div></div>
          </div>
          <div className="steps">
            <div className="step"><span className="n">1</span><p><b className="btn-ref mono">EDIT ON SIMBRIEF</b> opens the same pre-filled dispatch page as A2, to re-file an updated OFP.</p></div>
            <div className="step"><span className="n">2</span><p><b className="btn-ref mono">FETCH UPDATED PLAN</b> pulls that revision in and opens a Verify &amp; Upgrade panel to dispatch it as the next version.</p></div>
          </div>
          <div className="callout note"><span className="tag">Note</span><span>Dispatching a new version doesn&apos;t overwrite what the trainee sees. It lands as an available update — they must accept it in their own EFB&apos;s Flight Selection before it becomes active, same as A2&apos;s publish step.</span></div>
          <figure className="shot wide"><img src="/guides/instructor/config.png" alt="Config tab showing active OFP text and update workflow" /><figcaption>EFB Monitor · B2 Config</figcaption></figure>
        </section>

        <section className="section" id="b3">
          <div className="section-head"><span className="section-id">B3</span><h3>Payload</h3></div>
          <p className="sub">Four cards, top to bottom: what&apos;s loaded, how much fuel, an optional live sync to a connected PMDG simulator, and the documents that actually reach the trainee.</p>

          <div className="subcards">
            <div className="subcard">
              <h4><span className="k">1</span>Payload &amp; ZFW</h4>
              <p><b className="mono">RE-LOAD</b> regenerates a payload that exactly matches the OFP&apos;s target ZFW. Passenger zone sliders and cargo hold fields (each capped at that station&apos;s max) adjust it by hand. <b className="mono">TRANSMIT EZFW</b> / <b className="mono">TRANSMIT AZF</b> send early- and actual-zero-fuel-weight snapshots.</p>
            </div>
            <div className="subcard">
              <h4><span className="k">2</span>Fuel Control</h4>
              <p>Reference readouts: OFP Block Fuel, Standby Fuel, current FOB. A <b>Trainee Requested Fuel</b> banner appears once the trainee has submitted their own final fuel request. <span className="field">Step 1</span> Fuel Receipt Uplift (kg) and <span className="field">Step 2</span> Final Fuel in Tanks (L / Center / R, kg) feed <b className="mono">DISPATCH FUEL RECEIPT</b> — which relabels itself <b className="mono">RESEND CORRECTED FUEL RECEIPT</b> if the trainee rejected the last one.</p>
            </div>
            <div className="subcard">
              <h4><span className="k">3</span>PMDG Sim Connection</h4>
              <p>Only relevant with a P3D/PMDG session connected via Sim Control (Part C2). <b className="mono">SYNC PAYLOAD &amp; FUEL TO PMDG</b> pushes the current payload and total fuel straight into the PMDG FMC.</p>
            </div>
            <div className="subcard">
              <h4><span className="k">4</span>Document Dispatch</h4>
              <p><b className="mono">TRANSMIT PRELIM</b> is available any time. <b className="mono">TRANSMIT FINAL</b> stays locked until a fuel receipt has been sent. Both still transmit an over-limit loadsheet after a confirmation prompt — useful for a deliberate overweight/CG training scenario.</p>
            </div>
          </div>

          <figure className="shot wide"><img src="/guides/instructor/payload.png" alt="Payload tab with all four cards" /><figcaption>EFB Monitor · B3 Payload</figcaption></figure>
        </section>

        <section className="section" id="b4">
          <div className="section-head"><span className="section-id">B4</span><h3>WX</h3></div>
          <p className="sub">Generate METAR/TAF from plain English, then place it into the right per-airport box yourself.</p>
          <div className="steps">
            <div className="step"><span className="n">1</span><p>Describe conditions in the <b>AI Weather Generator</b> box (e.g. <i>&quot;heavy thunderstorms, visibility 800m, wind 270 at 25 gusting 40&quot;</i>) and click <b className="mono">GENERATE METAR &amp; TAF</b>.</p></div>
            <div className="step"><span className="n">2</span><p>The result splits into separate <b>Generated METAR</b> / <b>Generated TAF</b> boxes, each with its own <b className="mono">📋 COPY</b> button.</p></div>
            <div className="step"><span className="n">3</span><p>Paste into the matching METAR/TAF field below — Departure, Arrival, each Alternate, Takeoff Alternate, or an Enroute Alternate/Station (the last group collapses behind a count when there are many).</p></div>
          </div>
          <div className="callout warn"><span className="tag">Important</span><span>Generating text does not fill in the airport boxes automatically — copy, then paste into the right one. Nothing reaches the trainee until <b className="mono">SAVE &amp; PUBLISH WX TO EFB</b> at the bottom is clicked.</span></div>
          <figure className="shot wide"><img src="/guides/instructor/wx.png" alt="WX tab with AI generator and per-airport METAR/TAF fields" /><figcaption>EFB Monitor · B4 WX</figcaption></figure>
        </section>

        <section className="section" id="b5">
          <div className="section-head"><span className="section-id">B5</span><h3>NOTAMs</h3></div>
          <p className="sub">Same shape as WX, one generator instead of two.</p>
          <div className="steps">
            <div className="step"><span className="n">1</span><p>Describe the NOTAM in plain English (e.g. <i>&quot;RWY 07R closed 0600Z to 1200Z due to maintenance&quot;</i>) and click <b className="mono">GENERATE ICAO NOTAM</b>.</p></div>
            <div className="step"><span className="n">2</span><p>Copy the generated text and paste it into the matching Departure / Arrival / Alternate / Enroute box below.</p></div>
          </div>
          <div className="callout warn"><span className="tag">Important</span><span>Same as WX — nothing reaches the trainee until <b className="mono">SAVE &amp; PUBLISH NOTAMs TO EFB</b> is clicked.</span></div>
          <figure className="shot wide"><img src="/guides/instructor/notam.png" alt="NOTAMs tab with AI generator and per-airport fields" /><figcaption>EFB Monitor · B5 NOTAMs</figcaption></figure>
        </section>

        <section className="section" id="b6">
          <div className="section-head"><span className="section-id">B6</span><h3>NOTOC</h3></div>
          <p className="sub">Build the dangerous-goods manifest by hand, or paste it in from a spreadsheet — either way, it saves as a draft first.</p>

          <p><b>Paste from Spreadsheet</b> — tab-separated rows, 15 columns in <span className="mono">Station of Unloading → POS</span> order, one line per item. A header row is fine; it&apos;s detected and skipped.</p>
          <p><b>Add Dangerous Goods Item</b> — the same 15 fields one at a time: Station of Unloading, Air Waybill Number, UN/ID No., Proper Shipping Name, Class/Div, Sub Hazard, Net Quantity, Radio-active Mat. Categ., PG, Emergency Phone Number, IMP Code, ERG, CAO, Loaded ULD/IOD, POS. Only <span className="field">UN/ID No.</span> and <span className="field">Proper Shipping Name</span> are required to add an item.</p>

          <div className="steps">
            <div className="step"><span className="n">1</span><p>A status banner shows whether the current list matches what the trainee&apos;s EFB already shows: <span className="pill green">Published</span> or <span className="pill amber">Not yet published</span>.</p></div>
            <div className="step"><span className="n">2</span><p><b className="mono">SAVE DRAFT</b> keeps your edits for yourself — the trainee sees no change.</p></div>
            <div className="step"><span className="n">3</span><p><b className="mono">PUBLISH TO EFB</b> pushes the current list live immediately, including an empty list (published as NIL).</p></div>
          </div>

          <figure className="shot wide"><img src="/guides/instructor/notoc.png" alt="NOTOC tab with spreadsheet paste, manual entry form and publish controls" /><figcaption>EFB Monitor · B6 NOTOC</figcaption></figure>
        </section>
      </div>

      
      <div className="part" id="part-c">
        <div className="part-head"><span className="part-letter">C</span><h2>Other Modules</h2></div>
        <p className="part-dek">The other two buttons at the top of the IOS Panel, alongside EFB Monitor. Lighter reference — E-Techlog mirrors familiar tech-log workflows, and Sim Control only matters when a P3D/PMDG session is actually connected.</p>

        <section className="section" id="c1">
          <div className="section-head"><span className="section-id">C1</span><h3>E-Techlog</h3></div>
          <p className="sub">Opens the same Aircraft E-Techlog the trainee uses, in ENGINEER mode via your instructor/master access.</p>
          <p>Dashboard sections: <span className="field">Fluids</span>, <span className="field">Checks</span>, <span className="field">Defects</span>, <span className="field">Release</span>, plus PADD / SADD / ADD-MEL/CDL entries and any open TL entries logged by the trainee. <span className="mono">History</span> and <span className="mono">Reporting</span> tabs sit at the bottom alongside Dashboard. Close with the ✕ top-right, or <b className="mono">RETURN TO EFB</b> underneath — the panel opens as a full-screen overlay on top of EFB Monitor.</p>
          <figure className="shot wide"><img src="/guides/instructor/etechlog.png" alt="E-Techlog overlay in engineer mode" /><figcaption>E-Techlog · Engineer Mode</figcaption></figure>
        </section>

        <section className="section" id="c2">
          <div className="section-head"><span className="section-id">C2</span><h3>Sim Control</h3></div>
          <p className="sub">Drives a connected P3D + PMDG 777 session over FSUIPC. Everything here is inert while &quot;P3D OFFLINE&quot; shows in the top bar.</p>

          <div className="subcards">
            <div className="subcard"><h4>Telemetry</h4><p>Live flight data monitor read back from the connected simulator.</p></div>
            <div className="subcard"><h4>Ground Ops</h4><p>A command grid for doors and external power — entry/cargo doors, primary/secondary external power.</p></div>
            <div className="subcard"><h4>Failures</h4><p>A searchable, MEL-referenced PMDG 777 emergency matrix (filterable by Engine / Hydraulic / Electrical / Fuel / Air / APU), with an <span className="mono">INJECTION SAFE</span> lock to prevent accidental triggers.</p></div>
            <div className="subcard"><h4>Environmentals</h4><p>Weather scenario presets plus custom METAR injection straight into the sim.</p></div>
          </div>

          <p><b className="mono">INIT SCENARIO</b> and <b className="mono">PAUSE</b> sit in the status bar above all four sections.</p>
          <figure className="shot wide"><img src="/guides/instructor/simcontrol.png" alt="Sim Control Failures section with MEL-referenced emergency matrix" /><figcaption>Sim Control · Failures</figcaption></figure>
        </section>
      </div>

    </div>
  </div>

  <div className="closing">
    <h3>That&apos;s every control</h3>
    <p>For the fast version of this same flow, see the <a href="/guides/instructor-quickstart">Instructor Quick Start</a>. Everything here is training data only — nothing in this app is fit for operational use.</p>
  </div>

</div>
    </>
  );
}
