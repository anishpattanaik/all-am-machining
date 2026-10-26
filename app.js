/* All-Am Machining — page */
(function () {
  const { useState, useMemo } = React;
  const { html, Nav, CommandPalette, Chapter, Reveal, Button, Footer, MapCard, FAQ, OpenBadge, ActionBar, scrollToId, copy, useScrollProgress, pad } = Kit;
  const S = window.SITE;
  const B = S.biz;
  const TOTAL = 5;
  const TEL = "tel:" + B.phone.replace(/\D/g, "");

  const Nut = ({ size = 38, spin = 0 }) => html`<svg viewBox="0 0 48 48" width=${size} height=${size} aria-hidden="true" className="aa-nut">
    <g style=${{ transform: `rotate(${spin}deg)`, transformOrigin: "24px 24px" }}>
      <path d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z" fill="var(--navy)" />
      <circle cx="24" cy="24" r="10.5" fill="var(--bone)" />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke="var(--brick)" strokeWidth="2" strokeDasharray="2 2.2" />
    </g>
    <text x="24" y="28.5" textAnchor="middle" fontFamily="'Zilla Slab', serif" fontWeight="700" fontSize="12" fill="var(--navy)">A</text>
  </svg>`;

  /* ---------------- hero ---------------- */

  function Hero() {
    const p = useScrollProgress();
    return html`<section id="top" className="aa-hero">
      <div className="k-wrap aa-hero__grid">
        <div>
          <p className="k-kicker">Machine shop · Tracy, California</p>
          <h1 className="aa-h1">Machined parts.<br />Straight answers.</h1>
          <p className="k-lead">All-Am Machining is a Tracy machine shop. Call with a print, a sample part, or a problem — we'll tell you what it takes, what it costs, and when it'll be ready.</p>
          <div className="aa-dial">
            <a href=${TEL} className="aa-dial__b"><span className="k-mono">Phone</span><strong>${B.phone}</strong></a>
            <button type="button" className="aa-dial__b" onClick=${() => scrollToId("fax")}><span className="k-mono">Fax prints to</span><strong>${B.fax}</strong></button>
          </div>
        </div>
        <div className="aa-hero__art" aria-hidden="true">
          <${Nut} size=${340} spin=${p * 240} />
          <span className="aa-hero__stamp k-mono">Tracy · CA · 95304</span>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- traveler + fax cover ---------------- */

  function Bars({ seed }) {
    const s = (seed || "ALLAM").split("").reduce((a, c) => a + c.charCodeAt(0), 7);
    return html`<svg viewBox="0 0 120 28" className="aa-bars" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => {
      const w = ((s * (i + 3)) % 3) + 1; return html`<rect key=${i} x=${i * 3.5} y="0" width=${w * 0.8} height="28" fill="currentColor" />`;
    })}</svg>`;
  }

  function useJob() {
    const [j, setJ] = useState({ name: "", company: "", phone: "", part: "", pn: "", material: "Aluminum", qty: "10", due: "", ops: ["Mill", "Deburr", "Inspect"], notes: "", pages: "2" });
    return [j, setJ];
  }

  function Traveler({ j, setJ }) {
    const set = (k) => (e) => setJ({ ...j, [k]: e.target.value });
    const toggleOp = (o) => setJ({ ...j, ops: j.ops.includes(o) ? j.ops.filter((x) => x !== o) : S.ops.filter((x) => x === o || j.ops.includes(x)) });
    return html`<${Chapter} id="traveler" idx=${2} total=${TOTAL} label="Job traveler" kicker="Spec your job" title="Fill in the traveler. Then call or fax it in.">
      <div className="aa-trav">
        <div className="aa-trav__form">
          <div className="k-form__row">
            <label className="k-field"><span>Part name</span><input value=${j.part} onInput=${set("part")} placeholder="e.g. Pump shaft" /></label>
            <label className="k-field"><span>Part / drawing no.</span><input value=${j.pn} onInput=${set("pn")} placeholder="optional" /></label>
          </div>
          <div className="k-form__row">
            <label className="k-field"><span>Material</span><select value=${j.material} onChange=${set("material")}>${S.materials.map((m) => html`<option key=${m}>${m}</option>`)}</select></label>
            <label className="k-field"><span>Quantity</span><input value=${j.qty} onInput=${set("qty")} inputMode="numeric" /></label>
          </div>
          <fieldset className="aa-ops"><legend className="k-mono">Operations</legend>
            ${S.ops.map((o) => html`<label key=${o} className=${j.ops.includes(o) ? "is-on" : ""}><input type="checkbox" checked=${j.ops.includes(o)} onChange=${() => toggleOp(o)} /><span className="aa-box" aria-hidden="true"></span>${o}</label>`)}
          </fieldset>
          <label className="k-field"><span>Needed by</span><input type="date" value=${j.due} onInput=${set("due")} /></label>
          <label className="k-field"><span>Notes</span><textarea rows="3" value=${j.notes} onInput=${set("notes")} placeholder="Critical dims, finish, anything we should know"></textarea></label>
        </div>
        <article className="aa-ticket" aria-live="polite">
          <header><span className="k-mono">Shop traveler</span><${Bars} seed=${j.pn || j.part} /></header>
          <h3>${j.part || "Untitled part"}</h3>
          <div className="aa-ticket__meta k-mono"><span>P/N ${j.pn || "—"}</span><span>QTY ${j.qty || "—"}</span><span>${j.material.toUpperCase()}</span></div>
          <ol className="aa-ticket__ops">
            ${j.ops.length ? j.ops.map((o, i) => html`<li key=${o}><span className="k-mono">OP ${pad((i + 1) * 10, 3)}</span>${o}<i></i></li>`) : html`<li className="aa-empty">Check the operations you need</li>`}
          </ol>
          <div className="aa-ticket__foot k-mono"><span>DUE ${j.due || "—"}</span><span>${j.notes ? "NOTES ✓" : "NO NOTES"}</span></div>
        </article>
      </div>
    <//>`;
  }

  function Fax({ j, setJ }) {
    const set = (k) => (e) => setJ({ ...j, [k]: e.target.value });
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const summary = `${j.part || "Part"}${j.pn ? ` (P/N ${j.pn})` : ""} — qty ${j.qty || "?"}, ${j.material}. Ops: ${j.ops.join(", ") || "—"}.${j.due ? ` Due ${j.due}.` : ""}${j.notes ? " Notes: " + j.notes : ""}`;
    return html`<${Chapter} id="fax" idx=${3} total=${TOTAL} label="Fax a print" kicker="Old school works" title="Faxing a drawing? Your cover sheet is ready.">
      <div className="aa-fax">
        <div className="aa-fax__form">
          <div className="k-form__row">
            <label className="k-field"><span>Your name</span><input value=${j.name} onInput=${set("name")} autoComplete="name" /></label>
            <label className="k-field"><span>Company</span><input value=${j.company} onInput=${set("company")} autoComplete="organization" /></label>
          </div>
          <div className="k-form__row">
            <label className="k-field"><span>Call-back number</span><input value=${j.phone} onInput=${set("phone")} autoComplete="tel" /></label>
            <label className="k-field"><span>Pages incl. cover</span><input value=${j.pages} onInput=${set("pages")} inputMode="numeric" /></label>
          </div>
          <p className="k-small k-dim">The job details come from the traveler above. Print, put it on top of your drawing, and send to ${B.fax}.</p>
          <div className="k-btns">
            <${Button} onClick=${() => window.print()} icon="⎙">Print cover sheet<//>
            <${Button} variant="ghost" onClick=${() => copy(summary, "Job summary copied")} icon="⧉">Copy summary<//>
          </div>
        </div>
        <div className="aa-cover" id="aa-cover">
          <div className="aa-cover__top"><strong>FAX</strong><span>${today}</span></div>
          <table>
            <tbody>
              <tr><th>To</th><td>All-Am Machining</td><th>Fax</th><td>${B.fax}</td></tr>
              <tr><th>From</th><td>${j.name || "________________"}</td><th>Phone</th><td>${j.phone || "________________"}</td></tr>
              <tr><th>Company</th><td>${j.company || "________________"}</td><th>Pages</th><td>${j.pages || "__"}</td></tr>
              <tr><th>Re</th><td colSpan="3">Quote request — ${j.part || "machined part"}</td></tr>
            </tbody>
          </table>
          <div className="aa-cover__body"><span>Job</span><p>${summary}</p></div>
          <div className="aa-cover__checks">${["Urgent", "For review", "Please call", "Please quote"].map((c) => html`<span key=${c}><i>${c === "Please quote" ? "✕" : ""}</i>${c}</span>`)}</div>
        </div>
      </div>
    <//>`;
  }

  /* ---------------- app ---------------- */

  function App() {
    const [j, setJ] = useJob();
    const actions = useMemo(() => [
      { group: "Do", label: "Fill in a job traveler", hint: "Spec your part", keywords: "quote rfq", run: () => scrollToId("traveler") },
      { group: "Do", label: "Print a fax cover sheet", hint: B.fax, keywords: "fax drawing print", run: () => scrollToId("fax") },
      { group: "Contact", label: `Fax ${B.fax}`, hint: "Copy number", run: () => copy(B.fax, "Fax number copied") },
    ], []);
    return html`
      <${Nav} site=${S} logo=${html`<${Nut} />`} />
      <${CommandPalette} site=${S} actions=${actions} />
      <main id="main">
        <${Hero} />
        <${Chapter} id="work" idx=${1} total=${TOTAL} label="The work" kicker="What to call us about" title="If it can be cut from metal, start with a call.">
          <div className="aa-work">${S.work.map((w, i) => html`<${Reveal} key=${w.n} delay=${i * 70} className="aa-work__c"><span className="k-mono">${w.n}</span><h3>${w.t}</h3><p>${w.d}</p><//>`)}</div>
        <//>
        <${Traveler} j=${j} setJ=${setJ} />
        <${Fax} j=${j} setJ=${setJ} />
        <${Chapter} id="sample" idx=${4} total=${TOTAL} label="Copy a part" kicker="No drawing? No problem" title="Bring the old part. Here's what helps.">
          <ol className="aa-sample">${S.sample.map((s, i) => html`<${Reveal} as="li" key=${s} delay=${i * 70}><span>${i + 1}</span>${s}<//>`)}</ol>
        <//>
        <${Chapter} id="contact" idx=${5} total=${TOTAL} label="Contact" kicker="Call first" title="Talk to the shop.">
          <div className="k-grid k-grid--2">
            <${MapCard} biz=${B} />
            <div className="k-card aa-contact">
              <${OpenBadge} hours=${S.hours} fallback="Call ahead — hours by phone" />
              <a href=${TEL} className="aa-big"><span className="k-mono">Phone</span>${B.phone}</a>
              <div className="aa-big"><span className="k-mono">Fax</span>${B.fax}</div>
              <p className="k-small k-dim">Please call before dropping off parts so someone's ready for you.</p>
            </div>
          </div>
          <div className="aa-faq"><${FAQ} items=${S.faq} /></div>
        <//>
      </main>
      <${Footer} site=${S} logo=${html`<${Nut} />`} />
      <${ActionBar} site=${S} primary=${html`<a href="#traveler" className="is-primary">Spec a job</a>`} />
    `;
  }
  Kit.mount(App);
})();
