import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trainee Quick Start",
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
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--accent-strong); }

  .mono {
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  .shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 32px 120px;
  }

  /* ---------- Masthead ---------- */
  .masthead {
    padding: 56px 0 40px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 48px;
  }
  .eyebrow {
    font-family: "IBM Plex Mono", monospace;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-strong);
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  .eyebrow::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash);
    flex: none;
  }
  h1 {
    font-family: "Overpass", ui-sans-serif, sans-serif;
    font-weight: 800;
    font-size: clamp(2.1rem, 4vw, 3rem);
    line-height: 1.08;
    letter-spacing: -0.01em;
    margin: 0 0 14px;
    text-wrap: balance;
    max-width: 18ch;
  }
  .dek {
    font-size: 1.08rem;
    color: var(--ink-muted);
    max-width: 62ch;
    margin: 0 0 28px;
    text-wrap: pretty;
  }
  .docmeta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .docmeta span {
    font-family: "IBM Plex Mono", monospace;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-muted);
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 5px;
    padding: 6px 10px;
  }
  .docmeta b { color: var(--ink); font-weight: 600; }
  .docmeta span.link a { color: var(--accent-strong); text-decoration: none; }
  .docmeta span.link a:hover { text-decoration: underline; }

  .scope-note {
    margin-top: 28px;
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    background: var(--amber-wash);
    border: 1px solid color-mix(in srgb, var(--amber) 35%, var(--line));
    border-radius: 8px;
    font-size: 0.92rem;
    color: var(--ink);
    max-width: 68ch;
  }
  .scope-note .tag {
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--amber);
    flex: none;
    padding-top: 2px;
  }

  /* ---------- Layout: rail + procedure ---------- */
  .layout {
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr);
    gap: 56px;
    align-items: start;
  }
  .rail {
    position: sticky;
    top: 32px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 6px;
  }
  .rail-label {
    font-family: "IBM Plex Mono", monospace;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: 10px;
  }
  .rail a {
    text-decoration: none;
    color: var(--ink-muted);
    font-family: "IBM Plex Mono", monospace;
    font-size: 12.5px;
    font-weight: 500;
    padding: 7px 0;
    border-left: 2px solid var(--line-soft);
    padding-left: 14px;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .rail a:hover { color: var(--ink); border-left-color: var(--ink-faint); }
  .rail a b { color: var(--ink-faint); font-weight: 500; margin-right: 6px; }

  .procedure {
    display: flex;
    flex-direction: column;
  }

  .step {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 28px;
    padding: 44px 0;
    border-bottom: 1px solid var(--line-soft);
    scroll-margin-top: 28px;
  }
  .step:first-child { padding-top: 0; }
  .step:last-child { border-bottom: none; }

  .step-num {
    font-family: "Overpass", sans-serif;
    font-weight: 800;
    font-size: 1.9rem;
    color: var(--ink-faint);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .step-body h2 {
    font-family: "Overpass", sans-serif;
    font-weight: 700;
    font-size: 1.4rem;
    margin: 0 0 6px;
    letter-spacing: -0.005em;
  }
  .step-body .sub {
    font-size: 0.92rem;
    color: var(--ink-muted);
    margin: 0 0 20px;
    max-width: 62ch;
  }

  .step-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
    gap: 28px;
    align-items: start;
  }
  .step-content.wide {
    grid-template-columns: 1fr;
  }
  @media (max-width: 900px) {
    .step-content { grid-template-columns: 1fr; }
  }

  .step-text ul {
    margin: 0 0 16px;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .step-text li {
    position: relative;
    padding-left: 20px;
    font-size: 0.95rem;
  }
  .step-text li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: var(--accent);
    transform: rotate(45deg);
  }
  .step-text li b, .step-text li .field {
    font-family: "IBM Plex Mono", monospace;
    font-weight: 600;
    font-size: 0.86em;
    background: var(--accent-wash);
    color: var(--accent-strong);
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .step-text p { font-size: 0.95rem; margin: 0 0 14px; }

  .callout {
    display: flex;
    gap: 10px;
    font-size: 0.88rem;
    padding: 12px 14px;
    border-radius: 8px;
    margin-top: 4px;
    max-width: 72ch;
  }
  .callout.tip {
    background: var(--accent-wash);
    border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--line));
  }
  .callout.warn {
    background: var(--amber-wash);
    border: 1px solid color-mix(in srgb, var(--amber) 35%, var(--line));
  }
  .callout .tag {
    font-family: "IBM Plex Mono", monospace;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    flex: none;
  }
  .callout.tip .tag { color: var(--accent-strong); }
  .callout.warn .tag { color: var(--amber); }

  figure.shot {
    margin: 0;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  figure.shot.wide { max-width: 720px; }
  figure.shot img {
    display: block;
    width: 100%;
    height: auto;
    border-bottom: 1px solid var(--line);
  }
  figure.shot figcaption {
    font-family: "IBM Plex Mono", monospace;
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    padding: 9px 12px;
  }

  .shot-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 640px) {
    .shot-pair { grid-template-columns: 1fr; }
  }

  /* ---------- Closing ---------- */
  .closing {
    margin-top: 8px;
    padding: 32px 0 0;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 28px;
  }
  .closing h3 {
    font-family: "Overpass", sans-serif;
    font-size: 1.1rem;
    margin: 0 0 10px;
  }
  .closing p { font-size: 0.92rem; color: var(--ink-muted); max-width: 62ch; margin: 0; }

  @media (max-width: 760px) {
    .layout { grid-template-columns: 1fr; }
    .rail { display: none; }
    .step { grid-template-columns: 40px minmax(0,1fr); gap: 16px; }
    .step-num { font-size: 1.3rem; }
    .closing { grid-template-columns: 1fr; }
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
    <h1>Trainee Quick Start</h1>
    <p className="dek">The core workflow for flying a training session as trainee: pick and activate a flight, work the Dashboard, and step through Navlog, Weather, NOTAM and Communications.</p>
    <div className="docmeta">
      <span>Role: <b>Trainee</b></span>
      <span>Rev: <b>1.0</b></span>
      <span>Status: <b>Training use only</b></span>
      <span className="link">Need more detail: <a href="/guides/trainee-procedures">Operating Procedures</a></span>
    </div>
    <div className="scope-note">
      <span className="tag">Scope</span>
      <span>This guide covers the <b>trainee EFB</b> only — the instructor&apos;s dispatch side has its own <a href="/guides/instructor-quickstart">Quick Start</a> and <a href="/guides/instructor-procedures">Operating Procedures</a>.</span>
    </div>
  </header>

  <div className="layout">
    <nav className="rail">
      <div className="rail-label">On this page</div>
      <a href="#step-01"><b>01</b>Select &amp; activate</a>
      <a href="#step-02"><b>02</b>Dashboard</a>
      <a href="#step-03"><b>03</b>Loadsheet &amp; fuel</a>
      <a href="#step-04"><b>04</b>NOTOC</a>
      <a href="#step-05"><b>05</b>Accept aircraft</a>
      <a href="#step-06"><b>06</b>Navlog</a>
      <a href="#step-07"><b>07</b>Weather</a>
      <a href="#step-08"><b>08</b>NOTAM</a>
      <a href="#step-09"><b>09</b>Communication</a>
    </nav>

    <div className="procedure">

      <section className="step" id="step-01">
        <div className="step-num">01</div>
        <div className="step-body">
          <h2>Select &amp; activate a flight</h2>
          <p className="sub">Go to <span className="mono">/flight-select</span>, pick a flight, review the OFP, then activate the version you&apos;re flying.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">Available Flights</span> lists every flight the instructor has published.</li>
                <li><span className="field">OFP Versions</span> shows every dispatched version — pick one to read its <span className="field">Special Navigation Notes</span>.</li>
                <li>Viewing an older version shows a <span className="field">Compare</span> banner against the newest one, field by field.</li>
              </ul>
              <p>Toggle <b className="mono">ACTIVATE Vn</b> to make that version the one you&apos;re flying — this is the same activation the instructor&apos;s Config tab is watching for. Then <b className="mono">VIEW</b> opens the workspace.</p>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/flight-select.png" alt="Flight select screen with a flight chosen and V1 activated" />
              <figcaption>EFB Flight Selection</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-02">
        <div className="step-num">02</div>
        <div className="step-body">
          <h2>Dashboard</h2>
          <p className="sub">The home screen: four columns, every card clickable for full detail.</p>
          <div className="step-content wide">
            <div className="step-text">
              <ul>
                <li><span className="field">FMC &amp; ATS</span> — route/performance reference numbers, <b className="mono">SNN</b>/<b className="mono">DOCS</b> buttons, and the Crew roster card.</li>
                <li><span className="field">Fuel &amp; Weight</span> — the fuel table (Taxi/Trip/Cont/Reserve/Total) and ZFW/TOW/LW, each editable against the OFP baseline.</li>
                <li><span className="field">Loadsheet &amp; Airport</span> — Loadsheet, NOTOC and Airport cards.</li>
                <li><span className="field">Refuel &amp; Aircraft</span> — refuelling status, aircraft acceptance, defects, and an OTP/efficiency readout.</li>
              </ul>
              <div className="callout tip">
                <span className="tag">Tip</span>
                <span>On a narrow screen the four columns become swipeable full-screen slides — use the pill row at the top to jump between them.</span>
              </div>
            </div>
          </div>
          <figure className="shot wide" style={{maxWidth: '100%'}}>
            <img src="/guides/trainee/dashboard.png" alt="Dashboard with FMC and ATS, Fuel and Weight, Loadsheet and Airport, Refuel and Aircraft columns" />
            <figcaption>Dashboard</figcaption>
          </figure>
        </div>
      </section>

      <section className="step" id="step-03">
        <div className="step-num">03</div>
        <div className="step-body">
          <h2>Loadsheet &amp; fuel</h2>
          <p className="sub">Enter your revised ZFW, then work through the fuel figures the instructor dispatches back.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Click the <span className="field">Loadsheet</span> card for the full breakdown — weights &amp; fuel, weight limits (MTOW/MLAW/MZFW margins), and the EZFW datasheet.</li>
                <li>Type your <span className="field">Revised ZFW</span> into the Fuel &amp; Weight column — a <span className="field">Pending fuel</span> banner then appears.</li>
                <li>Tap that banner to open <span className="field">Accept Final Fuel Figures</span>: review Final Fuel / Log Fuel / Expected Uplift and the tank distribution, choose Standard or Non-Standard, and pick who gets notified.</li>
              </ul>
              <div className="callout warn">
                <span className="tag">Note</span>
                <span>If a loadsheet or fuel figure looks wrong, reject it instead of accepting — that sends the instructor a reason and asks for a corrected version.</span>
              </div>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/loadsheet.png" alt="Loadsheet and Payload Detail modal" />
              <figcaption>Loadsheet &amp; Payload Detail</figcaption>
            </figure>
          </div>
          <div className="shot-pair" style={{marginTop: '20px'}}>
            <figure className="shot"><img src="/guides/trainee/accept-fuel.png" alt="Accept Final Fuel Figures modal" /><figcaption>Accept Final Fuel Figures</figcaption></figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-04">
        <div className="step-num">04</div>
        <div className="step-body">
          <h2>NOTOC</h2>
          <p className="sub">Check what dangerous goods, if any, are loaded before departure.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Click the <span className="field">NOTOC</span> card to see the itemised manifest — UN number, shipping name, class, quantity, ULD and position.</li>
                <li>No items means the flight is clean — the card just reads <span className="field">Nil DG</span>.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/notoc.png" alt="Notification to Captain (NOTOC) modal with a dangerous goods item" />
              <figcaption>Notification to Captain (NOTOC)</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-05">
        <div className="step-num">05</div>
        <div className="step-body">
          <h2>Accept the aircraft</h2>
          <p className="sub">The <span className="mono">TECH LOG</span> tab, in Flight Crew mode — this is what feeds the instructor&apos;s &quot;Aircraft Accepted&quot; status.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">Fluids</span> / <span className="field">Checks</span> / <span className="field">Defects</span> / <span className="field">Release</span> / <span className="field">Acceptance</span> across the top track the aircraft&apos;s servicing state.</li>
                <li>A <span className="field">Pending Actions</span> card offers the next task — typically <b className="mono">PREPARE FLIGHT</b>.</li>
                <li>That task confirms Flight Number, Origin/Destination, Flight Type, Commander and Galaxy ID, then <b className="mono">CONFIRM &amp; PROCEED</b> accepts the aircraft.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/techlog.png" alt="Prepare Flight acceptance task in the Tech Log" />
              <figcaption>Tech Log · Prepare Flight</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-06">
        <div className="step-num">06</div>
        <div className="step-body">
          <h2>Navlog</h2>
          <p className="sub">Waypoint-by-waypoint reference — read-only, but where the fuel/time picture actually lives.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Each row: FL/MORA, wind/weight, lat/long, required fuel vs actual, and time vs ATA.</li>
                <li>The FIR bar along the top tracks which flight information region the route is currently in.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/navlog.png" alt="Navlog waypoint table" />
              <figcaption>Navlog</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-07">
        <div className="step-num">07</div>
        <div className="step-body">
          <h2>Weather</h2>
          <p className="sub">METAR and TAF for every airport relevant to the flight.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>One card per airport — Departure, Arrival, Alternate(s), and Enroute where applicable.</li>
                <li>An airport with nothing on file just reads <span className="field">NO METAR/TAF DATA AVAILABLE</span>.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/weather.png" alt="Weather Briefing with METAR and TAF per airport" />
              <figcaption>Weather Briefing</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-08">
        <div className="step-num">08</div>
        <div className="step-body">
          <h2>NOTAM</h2>
          <p className="sub">Same layout as Weather, one card per airport.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Departure is expanded by default; tap an airport&apos;s row to expand or collapse the rest.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/notam.png" alt="NOTAM Briefing per airport" />
              <figcaption>NOTAM Briefing</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-09">
        <div className="step-num">09</div>
        <div className="step-body">
          <h2>Communication</h2>
          <p className="sub">ACARS, PDC and ATIS requests all live on the one tab.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">Request PDC</span> — fill Dep/Arr/Facility/Flight No./ATIS Ident/Gate, <b className="mono">SEND PDC REQ</b>, then watch the <span className="field">Clearance Inbox</span> for the response.</li>
                <li><span className="field">Request ATIS</span> — Airport + Type (Departure/Arrival), <b className="mono">SEND ATIS REQ</b>, delivered to the <span className="field">ATIS Inbox</span>.</li>
                <li><span className="field">ACARS</span> — free-text messages to and from company.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/trainee/comms.png" alt="Communication tab with ACARS, Request PDC and Request ATIS" />
              <figcaption>Communication</figcaption>
            </figure>
          </div>
        </div>
      </section>

    </div>
  </div>

  <div className="closing">
    <div></div>
    <div>
      <h3>That&apos;s the core loop</h3>
      <p>Select &amp; activate a flight → work the Dashboard&apos;s loadsheet, fuel and NOTOC → accept the aircraft in Tech Log → check Navlog, Weather and NOTAM → handle PDC/ATIS/ACARS in Communication. Everything here is training data only — nothing in this app is fit for operational use.</p>
    </div>
  </div>

</div>
    </>
  );
}
