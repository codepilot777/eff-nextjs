import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructor Quick Start",
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
`}</style>
<div className="shell">

  <header className="masthead">
    <div className="eyebrow">Electronic Flight Folder — Training Mock Up</div>
    <h1>Instructor Quick Start</h1>
    <p className="dek">The core workflow for running a training session as instructor: sign in, dispatch a flight, and drive it live from the IOS control panel.</p>
    <div className="docmeta">
      <span>Role: <b>Instructor</b></span>
      <span>Rev: <b>1.0</b></span>
      <span>Status: <b>Training use only</b></span>
      <span className="link">Need more detail: <a href="/guides/instructor-procedures">Operating Procedures</a></span>
    </div>
    <div className="scope-note">
      <span className="tag">Scope</span>
      <span>This guide covers the <b>instructor side</b> only. For the trainee EFB, see the <a href="/guides/trainee-quickstart">Trainee Quick Start</a> and <a href="/guides/trainee-procedures">Operating Procedures</a>.</span>
    </div>
  </header>

  <div className="layout">
    <nav className="rail">
      <div className="rail-label">On this page</div>
      <a href="#step-01"><b>01</b>Sign in</a>
      <a href="#step-02"><b>02</b>Create &amp; dispatch</a>
      <a href="#step-03"><b>03</b>Manage sessions</a>
      <a href="#step-04"><b>04</b>Config</a>
      <a href="#step-05"><b>05</b>Payload</a>
      <a href="#step-06"><b>06</b>WX</a>
      <a href="#step-07"><b>07</b>NOTAMs</a>
      <a href="#step-08"><b>08</b>NOTOC</a>
    </nav>

    <div className="procedure">

      <section className="step" id="step-01">
        <div className="step-num">01</div>
        <div className="step-body">
          <h2>Sign in</h2>
          <p className="sub">Go to <span className="mono">/instructor</span> and sign in with the shared instructor password.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">Name</span> is just a label — it tags which sessions you created, and is remembered on this device next time.</li>
                <li><span className="field">Password</span> is the one shared instructor password for this training environment.</li>
              </ul>
              <div className="callout tip">
                <span className="tag">Tip</span>
                <span>Sign in with the name <span className="mono">admin</span> to see every instructor&apos;s sessions on the hub, not just your own.</span>
              </div>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/login.png" alt="Instructor login screen" />
              <figcaption>Instructor Login</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-02">
        <div className="step-num">02</div>
        <div className="step-body">
          <h2>Create &amp; dispatch a flight</h2>
          <p className="sub">Fill in the route, then hand off to SimBrief to actually generate the flight plan before bringing it back in.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">SimBrief Username</span>, <span className="field">Flight Number</span>, <span className="field">DEP/ARR ICAO</span> set the route SimBrief will plan.</li>
                <li><span className="field">Commander Name</span> and <span className="field">Crew FD / CC</span> are optional overrides — leave blank and the roster auto-fills at 2 flight deck / 14 cabin crew.</li>
                <li><span className="field">Generate Random NOTOC</span> spawns a dangerous-goods manifest for a DG training exercise.</li>
              </ul>
              <p><b className="mono">1 OPEN SIMBRIEF &amp; GENERATE</b> opens simbrief.com in a new tab, pre-filled with this route, so you can actually file the OFP.</p>
              <p><b className="mono">2 PREVIEW FLIGHT PLAN</b> pulls that OFP back in for review, then offers <b className="mono">SAVE AS DRAFT</b> (hold it back) or <b className="mono">PUBLISH TO EFB</b> (goes live for the trainee immediately).</p>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/create-flight.png" alt="Create new simulator flight form" />
              <figcaption>Create New Simulator Flight</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-03">
        <div className="step-num">03</div>
        <div className="step-body">
          <h2>Manage sessions</h2>
          <p className="sub">Every flight you create shows up as a card on the hub, whether it&apos;s still a draft or already live.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>A <span className="field">DRAFT</span> card can be prepared quietly, then pushed live later with <b className="mono">PUBLISH</b> — no need to recreate the flight.</li>
                <li><b className="mono">IOS PANEL</b> opens the live control panel for that session — see steps 04–08.</li>
              </ul>
              <div className="callout warn">
                <span className="tag">Caution</span>
                <span>The 🗑 icon deletes a session immediately, with no confirmation prompt.</span>
              </div>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/sessions.png" alt="Session list with draft and published flights" />
              <figcaption>Your Simulator Sessions</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-04">
        <div className="step-num">04</div>
        <div className="step-body">
          <h2>Config — update the flight plan mid-session</h2>
          <p className="sub">The first IOS Panel tab: today&apos;s active OFP, and a way to dispatch a revised one.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>The header shows which OFP version the trainee has actually <span className="field">activated</span> — not just the latest one you&apos;ve dispatched.</li>
                <li><b className="mono">1 EDIT ON SIMBRIEF</b> → <b className="mono">2 FETCH UPDATED PLAN</b> pulls a revised OFP and lets you dispatch it as a new version.</li>
                <li>A dispatched update doesn&apos;t overwrite what the trainee sees — they must accept it in their own EFB before it becomes active.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/qs-ios-config.png" alt="Config tab showing active OFP text and update workflow" />
              <figcaption>IOS Panel · 1. Config</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-05">
        <div className="step-num">05</div>
        <div className="step-body">
          <h2>Payload — adjust load &amp; ZFW</h2>
          <p className="sub">Drive passenger and cargo loading live, independent of what SimBrief originally planned.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Passenger zone sliders and cargo hold fields update the aircraft&apos;s loaded state directly.</li>
                <li><span className="field">OFP Target ZFW</span> stays visible as a reference figure while you adjust the live load.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/qs-ios-payload.png" alt="Payload tab with passenger zones and cargo holds" />
              <figcaption>IOS Panel · 2. Payload</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-06">
        <div className="step-num">06</div>
        <div className="step-body">
          <h2>WX — generate METAR &amp; TAF</h2>
          <p className="sub">Describe the weather you want in plain English; the tab writes it out in proper ICAO format.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Type conditions like <i>&quot;heavy thunderstorms, visibility 800m, wind 270 at 25 gusting 40&quot;</i> and generate.</li>
                <li>Departure and arrival METAR/TAF are generated and edited separately.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/qs-ios-wx.png" alt="WX tab AI weather generator" />
              <figcaption>IOS Panel · 3. WX</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-07">
        <div className="step-num">07</div>
        <div className="step-body">
          <h2>NOTAMs</h2>
          <p className="sub">Same idea as WX: describe it, generate ICAO-format NOTAM text per airport.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li>Type conditions like <i>&quot;RWY 07R closed 0600Z to 1200Z due to maintenance&quot;</i> and generate.</li>
                <li>Generated NOTAMs land in separate departure / arrival panels for editing before the trainee sees them.</li>
              </ul>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/qs-ios-notams.png" alt="NOTAMs tab AI notam generator" />
              <figcaption>IOS Panel · 4. NOTAMs</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="step" id="step-08">
        <div className="step-num">08</div>
        <div className="step-body">
          <h2>NOTOC — dangerous goods manifest</h2>
          <p className="sub">Build the DG manifest by hand or by pasting rows straight from a spreadsheet.</p>
          <div className="step-content">
            <div className="step-text">
              <ul>
                <li><span className="field">Paste from Spreadsheet</span> accepts tab-separated rows in STATION → POS column order, one line per item.</li>
                <li>Items can also be added one at a time below the paste box.</li>
              </ul>
              <div className="callout tip">
                <span className="tag">Tip</span>
                <span>NOTOC changes save as a draft first — nothing reaches the trainee&apos;s EFB until you explicitly publish it.</span>
              </div>
            </div>
            <figure className="shot">
              <img src="/guides/instructor/qs-ios-notoc.png" alt="NOTOC tab dangerous goods manifest entry" />
              <figcaption>IOS Panel · 5. NOTOC</figcaption>
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
      <p>Sign in → create &amp; dispatch a flight → publish it → drive Config, Payload, WX, NOTAMs and NOTOC live from the IOS Panel as the exercise runs. Everything here is training data only — nothing in this app is fit for operational use.</p>
    </div>
  </div>

</div>
    </>
  );
}
