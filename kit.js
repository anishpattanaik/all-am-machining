/* ---------------------------------------------------------------
   Local Business Site Kit — shared React components (no build step).
   Loads after React 18 UMD + htm UMD. Each site ships its own copy
   so it can be handed over and hosted on its own.
---------------------------------------------------------------- */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const html = htm.bind(React.createElement);

  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const reduceMotion = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const scrollToId = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });

  /* Primary contact: phone if the business has one, otherwise biz.contactHref (email / DM). */
  const contactOf = (biz) =>
    biz.phone
      ? { href: "tel:" + biz.phone.replace(/[^\d+]/g, ""), label: `Call ${biz.phone}`, short: "Call", value: biz.phone }
      : { href: biz.contactHref, label: biz.contactLabel || "Get in touch", short: biz.contactShort || "Message", value: biz.contactValue || "" };
  const directionsUrl = (biz) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(biz.name + ", " + biz.address)}`;

  /* ---------- hooks ---------- */

  function useInView(opts = {}) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      if (!("IntersectionObserver" in window)) { setSeen(true); return; }
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) { setSeen(true); if (!opts.repeat) io.disconnect(); }
          else if (opts.repeat) setSeen(false);
        },
        { threshold: opts.threshold ?? 0.15, rootMargin: opts.rootMargin ?? "0px 0px -6% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return [ref, seen];
  }

  function useScrollProgress() {
    const [p, setP] = useState(0);
    useEffect(() => {
      let raf = 0;
      const on = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const h = document.documentElement;
          const max = h.scrollHeight - h.clientHeight;
          setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
        });
      };
      on();
      window.addEventListener("scroll", on, { passive: true });
      window.addEventListener("resize", on);
      return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
    }, []);
    return p;
  }

  function useActiveSection(ids) {
    const [active, setActive] = useState(null);
    useEffect(() => {
      const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
      if (!els.length || !("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
        { rootMargin: "-45% 0px -50% 0px" }
      );
      els.forEach((el) => io.observe(el));
      return () => io.disconnect();
    }, [ids.join("|")]);
    return active;
  }

  function useLocal(key, initial) {
    const [v, setV] = useState(() => {
      try { const s = localStorage.getItem(key); return s == null ? initial : JSON.parse(s); }
      catch { return initial; }
    });
    useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
    return [v, setV];
  }

  function useNow(ms = 30000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
    return now;
  }

  /* ---------- toasts ---------- */

  let pushToast = () => {};
  function Toasts() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      pushToast = (msg) => {
        const id = Math.random();
        setItems((x) => [...x, { id, msg }]);
        setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 2600);
      };
    }, []);
    return html`<div className="k-toasts" role="status" aria-live="polite">
      ${items.map((t) => html`<div key=${t.id} className="k-toast">${t.msg}</div>`)}
    </div>`;
  }
  const toast = (m) => pushToast(m);
  async function copy(text, label = "Copied") {
    try { await navigator.clipboard.writeText(text); toast(`${label} ✓`); }
    catch { toast("Copy isn't available in this browser"); }
  }

  /* ---------- primitives ---------- */

  function Reveal({ children, as = "div", className = "", delay = 0, ...rest }) {
    const [ref, seen] = useInView();
    return React.createElement(
      as,
      { ref, className: `k-reveal ${seen ? "is-in" : ""} ${className}`, style: { transitionDelay: `${delay}ms` }, ...rest },
      children
    );
  }

  function CountUp({ to, decimals = 0, duration = 1400, prefix = "", suffix = "" }) {
    const [ref, seen] = useInView({ threshold: 0.4 });
    const [v, setV] = useState(0);
    useEffect(() => {
      if (!seen) return;
      if (reduceMotion()) { setV(to); return; }
      let raf, t0;
      const step = (t) => {
        t0 = t0 || t;
        const k = Math.min(1, (t - t0) / duration);
        setV(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [seen, to]);
    const shown = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US");
    return html`<span ref=${ref} className="k-num">${prefix}${shown}${suffix}</span>`;
  }

  function Stat({ value, label, note, decimals = 0, prefix = "", suffix = "", raw }) {
    return html`<div className="k-stat">
      <div className="k-stat__v">${raw != null ? raw : html`<${CountUp} to=${value} decimals=${decimals} prefix=${prefix} suffix=${suffix} />`}</div>
      <div className="k-stat__l">${label}</div>
      ${note && html`<div className="k-stat__n">${note}</div>`}
    </div>`;
  }

  /* Numbered chapter panel, Apex-style: [ 02 / LABEL ]   02 / 06 */
  function Chapter({ id, idx, total, label, title, kicker, children, className = "", prefix = "" }) {
    return html`<section id=${id} className=${`k-chapter ${className}`} aria-labelledby=${id + "-h"}>
      <div className="k-wrap">
        <${Reveal} className="k-chapter__head">
          <span className="k-mono k-chapter__tag">[ ${prefix}${pad(idx)} / ${label.toUpperCase()} ]</span>
          <span className="k-chapter__rule" aria-hidden="true"></span>
          <span className="k-mono k-chapter__count">${pad(idx)} / ${pad(total)}</span>
        <//>
        <${Reveal} delay=${80}>
          ${kicker && html`<p className="k-kicker">${kicker}</p>`}
          <h2 id=${id + "-h"} className="k-h2">${title}</h2>
        <//>
        ${children}
      </div>
    </section>`;
  }

  function Button({ href, onClick, children, variant = "primary", ext, icon, ...rest }) {
    const cls = `k-btn k-btn--${variant}`;
    const arrow = icon === false ? null : html`<span className="k-btn__arrow" aria-hidden="true">${icon || (ext ? "↗" : "→")}</span>`;
    if (href)
      return html`<a className=${cls} href=${href} target=${ext ? "_blank" : undefined} rel=${ext ? "noopener noreferrer" : undefined} ...${rest}>
        <span>${children}</span>${arrow}${ext && html`<span className="k-sr"> (opens in a new tab)</span>`}
      </a>`;
    return html`<button type="button" className=${cls} onClick=${onClick} ...${rest}><span>${children}</span>${arrow}</button>`;
  }

  /* ---------- business hours (live, in the shop's own time zone) ---------- */

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const fmtH = (h) => {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    const ap = hh >= 12 && hh < 24 ? "PM" : "AM";
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}${mm ? ":" + pad(mm) : ""} ${ap}`;
  };
  function zonedNow(tz, d) {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d);
    const get = (t) => p.find((x) => x.type === t)?.value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, h: (+get("hour") % 24) + +get("minute") / 60 };
  }
  /* hours: array of 7 (Sun..Sat), each null or [open, close] in 24h decimal */
  function openStatus(hours, tz = "America/Los_Angeles", d = new Date()) {
    if (!hours) return null;
    const { day, h } = zonedNow(tz, d);
    const today = hours[day];
    if (today && h >= today[0] && h < today[1]) {
      const left = today[1] - h;
      return { open: true, soon: left <= 0.75, text: left <= 0.75 ? `Closing soon · ${fmtH(today[1])}` : `Open now · until ${fmtH(today[1])}` };
    }
    if (today && h < today[0]) return { open: false, text: `Opens today at ${fmtH(today[0])}` };
    for (let k = 1; k <= 7; k++) {
      const dd = (day + k) % 7;
      if (hours[dd]) return { open: false, text: `Closed · opens ${k === 1 ? "tomorrow" : DAYS[dd]} ${fmtH(hours[dd][0])}` };
    }
    return { open: false, text: "Call for hours" };
  }

  function OpenBadge({ hours, tz, fallback = "Call ahead for hours" }) {
    const now = useNow();
    const s = openStatus(hours, tz, now);
    return html`<span className=${`k-open ${s ? (s.open ? (s.soon ? "is-soon" : "is-open") : "is-closed") : "is-unknown"}`}>
      <i aria-hidden="true"></i>${s ? s.text : fallback}
    </span>`;
  }

  function HoursTable({ hours, tz = "America/Los_Angeles", note }) {
    const now = useNow();
    const { day } = zonedNow(tz, now);
    const order = [1, 2, 3, 4, 5, 6, 0];
    return html`<div className="k-hours">
      <table>
        <caption className="k-sr">Weekly hours</caption>
        <tbody>
          ${order.map((d) => html`<tr key=${d} className=${d === day ? "is-today" : ""}>
            <th scope="row">${DAYS[d]}${d === day ? html` <small className="k-mono">today</small>` : ""}</th>
            <td>${hours[d] ? `${fmtH(hours[d][0])} – ${fmtH(hours[d][1])}` : "Closed"}</td>
          </tr>`)}
        </tbody>
      </table>
      ${note && html`<p className="k-small k-dim">${note}</p>`}
    </div>`;
  }

  /* ---------- map card ---------- */

  function MapCard({ biz }) {
    const q = encodeURIComponent(`${biz.name}, ${biz.address}`);
    const [live, setLive] = useState(false);
    return html`<div className="k-map">
      ${live
        ? html`<iframe title=${`Map to ${biz.name}`} src=${`https://maps.google.com/maps?q=${q}&z=16&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>`
        : html`<button type="button" className="k-map__ph" onClick=${() => setLive(true)} aria-label="Load interactive map">
            <svg viewBox="0 0 400 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
              <defs><pattern id="kgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeOpacity=".12" /></pattern></defs>
              <rect width="400" height="240" fill="url(#kgrid)" />
              <path d="M-10 150 L410 120" stroke="currentColor" strokeOpacity=".35" strokeWidth="10" />
              <path d="M160 -10 L190 250" stroke="currentColor" strokeOpacity=".25" strokeWidth="6" />
              <path d="M40 -10 L60 250" stroke="currentColor" strokeOpacity=".15" strokeWidth="4" />
              <path d="M300 -10 L320 250" stroke="currentColor" strokeOpacity=".15" strokeWidth="4" />
              <g transform="translate(205 118)"><circle r="22" className="k-map__pulse" /><path d="M0-26c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" className="k-map__pin" /><circle cy="-10" r="5" fill="var(--bg)" /></g>
            </svg>
            <span className="k-mono">Tap to load live map</span>
          </button>`}
      <div className="k-map__meta">
        <div><strong>${biz.address}</strong>${biz.addressNote && html`<span className="k-dim k-small">${biz.addressNote}</span>`}</div>
        <div className="k-map__actions">
          <a className="k-link" href=${`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer">Directions ↗</a>
          <button type="button" className="k-link" onClick=${() => copy(biz.address, "Address copied")}>Copy address</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- FAQ accordion ---------- */

  function FAQ({ items }) {
    const [open, setOpen] = useState(0);
    return html`<div className="k-faq">
      ${items.map((f, i) => html`<div key=${f.q} className=${`k-faq__item ${open === i ? "is-open" : ""}`}>
        <h3>
          <button type="button" aria-expanded=${open === i} aria-controls=${"faq-" + i} onClick=${() => setOpen(open === i ? -1 : i)}>
            <span className="k-mono">${pad(i + 1)}</span><span>${f.q}</span><i aria-hidden="true"></i>
          </button>
        </h3>
        <div id=${"faq-" + i} className="k-faq__a" role="region" hidden=${open !== i}><p>${f.a}</p></div>
      </div>`)}
    </div>`;
  }

  /* ---------- navigation ---------- */

  function Nav({ site, logo, extra, cta }) {
    const ids = site.nav.map((n) => n.id);
    const active = useActiveSection(ids);
    const progress = useScrollProgress();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      const on = () => setScrolled(window.scrollY > 24);
      on();
      window.addEventListener("scroll", on, { passive: true });
      return () => window.removeEventListener("scroll", on);
    }, []);
    useEffect(() => {
      document.body.style.overflow = open ? "hidden" : "";
      const esc = (e) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", esc);
      return () => window.removeEventListener("keydown", esc);
    }, [open]);
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
    return html`
      <a className="k-skip" href="#main">Skip to content</a>
      <header className=${`k-nav ${scrolled ? "is-scrolled" : ""} ${open ? "is-menu" : ""}`}>
        <div className="k-nav__bar" style=${{ transform: `scaleX(${progress})` }} aria-hidden="true"></div>
        <div className="k-wrap k-nav__inner">
          <a href="#top" className="k-brand" aria-label=${`${site.biz.name}, back to top`}>
            ${logo}
            <span className="k-brand__text"><strong>${site.biz.short || site.biz.name}</strong><span className="k-mono">${site.biz.tag}</span></span>
          </a>
          <nav className="k-nav__links" aria-label="Sections">
            ${site.nav.map((n) => html`<a key=${n.id} href=${"#" + n.id} className=${active === n.id ? "is-active" : ""} data-hint=${n.hint} aria-current=${active === n.id ? "true" : undefined}>${n.label}</a>`)}
          </nav>
          <div className="k-nav__tools">
            ${extra}
            <button type="button" className="k-kbd-btn" onClick=${() => window.dispatchEvent(new Event("k:palette"))} aria-label="Open search">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <kbd>${isMac ? "⌘" : "Ctrl"} K</kbd>
            </button>
            ${cta}
            <button type="button" className="k-menu-btn" aria-expanded=${open} aria-controls="k-drawer" onClick=${() => setOpen(!open)}>
              <span className="k-menu-btn__lines" aria-hidden="true"><i></i><i></i></span>
              <span>${open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </header>
      <div id="k-drawer" className=${`k-drawer ${open ? "is-open" : ""}`} aria-hidden=${!open} inert=${open ? undefined : ""}>
        <nav className="k-wrap" aria-label="Menu">
          ${site.nav.map((n, i) => html`<a key=${n.id} href=${"#" + n.id} onClick=${() => setOpen(false)} style=${{ transitionDelay: `${open ? 60 + i * 45 : 0}ms` }}>
            <span className="k-mono">${pad(i + 1)}</span><span>${n.label}</span><small>${n.hint}</small>
          </a>`)}
          <div className="k-drawer__foot">
            <a className="k-btn k-btn--primary" href=${contactOf(site.biz).href}><span>${contactOf(site.biz).label}</span><span className="k-btn__arrow" aria-hidden="true">↗</span></a>
          </div>
        </nav>
      </div>`;
  }

  /* ---------- ⌘K command palette ---------- */

  function CommandPalette({ site, actions = [] }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [i, setI] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const lastFocus = useRef(null);
    const ct = contactOf(site.biz);

    const items = useMemo(() => {
      const base = [
        ...site.nav.map((n) => ({ group: "Jump to", label: n.label, hint: n.hint, run: () => scrollToId(n.id) })),
        ...actions,
        { group: "Contact", label: ct.label, hint: site.biz.phone ? "Opens your phone app" : ct.value, run: () => (ct.href.startsWith("http") ? window.open(ct.href, "_blank", "noopener") : (location.href = ct.href)) },
        ...(site.biz.address ? [
          { group: "Contact", label: "Copy address", hint: site.biz.address, run: () => copy(site.biz.address, "Address copied") },
          { group: "Contact", label: "Get directions", hint: "Google Maps", run: () => window.open(directionsUrl(site.biz), "_blank", "noopener") },
        ] : []),
        ...(site.links || []).map((l) => ({ group: "Elsewhere", label: l.label, hint: l.href.replace(/^https?:\/\/(www\.)?/, ""), run: () => window.open(l.href, "_blank", "noopener") })),
        { group: "Utility", label: "Copy link to this page", hint: "Share it", run: () => copy(location.href.split("#")[0], "Link copied") },
        { group: "Utility", label: "Back to top", hint: "Home", run: () => window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }) },
      ];
      const s = q.trim().toLowerCase();
      if (!s) return base;
      return base
        .map((it) => {
          const hay = `${it.label} ${it.hint || ""} ${it.group} ${it.keywords || ""}`.toLowerCase();
          let score = hay.startsWith(s) ? 3 : hay.includes(s) ? 2 : 0;
          if (!score) { let k = 0; for (const c of hay) if (c === s[k]) k++; score = k === s.length ? 1 : 0; }
          return { it, score };
        })
        .filter((x) => x.score)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.it);
    }, [q, actions]);

    useEffect(() => {
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
        else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName || "")) { e.preventDefault(); setOpen(true); }
      };
      const onOpen = () => setOpen(true);
      window.addEventListener("keydown", onKey);
      window.addEventListener("k:palette", onOpen);
      return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("k:palette", onOpen); };
    }, []);
    useEffect(() => {
      if (open) { lastFocus.current = document.activeElement; setQ(""); setI(0); setTimeout(() => inputRef.current?.focus(), 20); }
      else lastFocus.current?.focus?.();
    }, [open]);
    useEffect(() => setI(0), [q]);
    useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); }, [i]);

    if (!open) return null;
    const run = (it) => { setOpen(false); setTimeout(it.run, 40); };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      else if (e.key === "Enter" && items[i]) { e.preventDefault(); run(items[i]); }
      else if (e.key === "Tab") e.preventDefault();
    };
    let lastGroup = null;
    return html`<div className="k-pal" role="dialog" aria-modal="true" aria-label="Search this site" onMouseDown=${(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="k-pal__box" onKeyDown=${onKey}>
        <div className="k-pal__top">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <input ref=${inputRef} value=${q} onInput=${(e) => setQ(e.target.value)} placeholder=${site.searchPlaceholder || `Search ${site.biz.name}…`} aria-label="Search" role="combobox" aria-expanded="true" aria-controls="k-pal-list" aria-activedescendant=${items[i] ? "k-opt-" + i : undefined} />
          <kbd>esc</kbd>
        </div>
        <ul id="k-pal-list" ref=${listRef} className="k-pal__list" role="listbox">
          ${items.length === 0 && html`<li className="k-pal__empty">Nothing matches “${q}”. Try “hours” or “call”.</li>`}
          ${items.map((it, n) => {
            const head = it.group !== lastGroup ? html`<li className="k-pal__group" role="presentation">${it.group}</li>` : null;
            lastGroup = it.group;
            return html`<${React.Fragment} key=${it.group + it.label}>${head}<li id=${"k-opt-" + n} role="option" aria-selected=${n === i} className=${n === i ? "is-on" : ""} onMouseMove=${() => n !== i && setI(n)} onClick=${() => run(it)}>
              <span>${it.label}</span><small>${it.hint || ""}</small>
            </li><//>`;
          })}
        </ul>
        <div className="k-pal__foot k-mono"><span>↑↓ move</span><span>↵ open</span><span>/ opens this anywhere</span></div>
      </div>
    </div>`;
  }

  /* ---------- contact form ---------- */

  /* preset / presetMsg let other widgets pre-fill the form; pass a new object each time ({ text }) */
  function ContactForm({ site, topics, preset, presetMsg, submitLabel = "Send message", extraFields, note, attachments }) {
    const [f, setF] = useState({ name: "", phone: "", email: "", topic: preset || topics[0], msg: "" });
    const [err, setErr] = useState({});
    const [sent, setSent] = useState(false);
    useEffect(() => { if (preset) setF((x) => ({ ...x, topic: preset })); }, [preset]);
    useEffect(() => { if (presetMsg) { setSent(false); setF((x) => ({ ...x, msg: presetMsg.text, topic: presetMsg.topic || x.topic })); } }, [presetMsg]);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const submit = (e) => {
      e.preventDefault();
      const er = {};
      if (!f.name.trim()) er.name = "Who should we ask for?";
      if (!f.phone.trim() && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Leave a phone number or an email so we can reply";
      if (f.msg.trim().length < 8) er.msg = "A sentence or two helps a lot";
      setErr(er);
      if (Object.keys(er).length) return;
      if (site.biz.email) {
        const files = attachments && attachments.length ? `\n\nFiles to attach: ${attachments.join(", ")}` : "";
        const body = `${f.msg}${files}\n\n— ${f.name}\n${f.phone}\n${f.email}`;
        window.location.href = `mailto:${site.biz.email}?subject=${encodeURIComponent(`[${f.topic}] from ${f.name}`)}&body=${encodeURIComponent(body)}`;
      }
      setSent(true);
    };
    if (sent)
      return html`<div className="k-form k-form--sent" role="status">
        <span className="k-mono">✓ Message ready</span>
        <h3>Thanks, ${f.name.trim().split(" ")[0]}.</h3>
        <p>${site.biz.email ? "Your email app should have opened with everything filled in." : `This preview isn't connected to an inbox yet. Once the site goes live, it'll go straight to the shop. Until then: ${site.biz.phone ? "call " + site.biz.phone : contactOf(site.biz).label}.`}</p>
        <button type="button" className="k-link" onClick=${() => { setSent(false); setF({ ...f, msg: "" }); }}>Write another</button>
      </div>`;
    const field = (k, label, type = "text", extra = {}) => html`<label className=${`k-field ${err[k] ? "has-err" : ""}`}>
      <span>${label}</span>
      ${type === "textarea"
        ? html`<textarea rows="4" value=${f[k]} onInput=${set(k)} aria-invalid=${!!err[k]} ...${extra}></textarea>`
        : html`<input type=${type} value=${f[k]} onInput=${set(k)} aria-invalid=${!!err[k]} ...${extra} />`}
      ${err[k] && html`<em>${err[k]}</em>`}
    </label>`;
    return html`<form className="k-form" onSubmit=${submit} noValidate>
      <div className="k-form__row">
        ${field("name", "Your name", "text", { autoComplete: "name" })}
        <label className="k-field"><span>What's this about?</span>
          <select value=${f.topic} onChange=${set("topic")}>${topics.map((t) => html`<option key=${t}>${t}</option>`)}</select>
        </label>
      </div>
      <div className="k-form__row">
        ${field("phone", "Phone", "tel", { autoComplete: "tel" })}
        ${field("email", "Email", "email", { autoComplete: "email" })}
      </div>
      ${extraFields}
      ${field("msg", "Message", "textarea")}
      <div className="k-form__foot">
        <span className="k-dim k-small">${note || "We usually reply within a business day."}</span>
        <button className="k-btn k-btn--primary" type="submit"><span>${submitLabel}</span><span className="k-btn__arrow" aria-hidden="true">→</span></button>
      </div>
    </form>`;
  }

  /* ---------- footer ---------- */

  function Footer({ site, logo, titleBlock = true, children }) {
    const year = new Date().getFullYear();
    return html`<footer className="k-foot">
      <div className="k-wrap">
        <div className="k-foot__grid">
          <div className="k-foot__about">
            <div className="k-brand">${logo}<span className="k-brand__text"><strong>${site.biz.name}</strong><span className="k-mono">${site.biz.tag}</span></span></div>
            <p>${site.biz.footer}</p>
            <p className="k-foot__contact">
              <a href=${contactOf(site.biz).href}>${site.biz.phone || contactOf(site.biz).value || contactOf(site.biz).label}</a><br />
              <span>${site.biz.address || site.biz.area || ""}</span>
            </p>
          </div>
          <div>
            <h3 className="k-mono">On this page</h3>
            <ul>${site.nav.map((n) => html`<li key=${n.id}><a href=${"#" + n.id}>${n.label}</a></li>`)}</ul>
          </div>
          <div>
            <h3 className="k-mono">Elsewhere</h3>
            <ul>${(site.links || []).map((l) => html`<li key=${l.href}><a href=${l.href} target="_blank" rel="noopener noreferrer">${l.label} <span aria-hidden="true">↗</span></a></li>`)}</ul>
            ${children}
          </div>
        </div>
        ${titleBlock && html`<div className="k-title-block k-mono" aria-label="Site details">
          ${(site.titleBlock || [
            ["Title", site.biz.name.toUpperCase()],
            ["Location", "TRACY, CA"],
            ["Rev", "A"],
            ["Sheet", "1 of 1"],
            ["Date", String(year)],
          ]).map(([k, v]) => html`<div key=${k}><span>${k}</span><b>${v}</b></div>`)}
        </div>`}
        <p className="k-legal">© ${year} ${site.biz.legal || site.biz.name}. ${site.biz.since ? `Serving Tracy since ${site.biz.since}.` : ""} ${site.legalNote || ""}</p>
        <p className="k-legal k-mono">${site.colophon}</p>
      </div>
    </footer>`;
  }

  /* ---------- mobile sticky action bar ---------- */

  function ActionBar({ site, primary }) {
    const p = useScrollProgress();
    const ct = contactOf(site.biz);
    return html`<div className=${`k-actionbar ${p > 0.04 && p < 0.97 ? "is-on" : ""}`}>
      <a href=${ct.href} className="k-actionbar__call" target=${ct.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">${ct.short}</a>
      ${site.biz.address && html`<a href=${directionsUrl(site.biz)} target="_blank" rel="noopener noreferrer">Directions</a>`}
      ${primary}
    </div>`;
  }

  /* Preview strip — shown only while preview.js defines window.PREVIEW.
     Delete the preview.js <script> tag in index.html to launch for real. */
  function PreviewBar() {
    const P = window.PREVIEW;
    if (!P) return null;
    return html`<aside className="k-preview" aria-label="Preview notice">
      <div className="k-wrap k-preview__in">
        <span className="k-mono">Preview</span>
        <p>A website built for <strong>${P.for}</strong> by ${P.by}. Not the official site yet — ${P.note || "everything here can be changed."}</p>
        <a href=${"mailto:" + P.email}>${P.email}</a>
      </div>
    </aside>`;
  }

  function mount(App) {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(html`<${PreviewBar} /><${App} /><${Toasts} />`);
    document.documentElement.classList.add("js");
  }

  window.Kit = {
    html, pad, reduceMotion, scrollToId, contactOf, directionsUrl, useInView, useScrollProgress, useActiveSection, useLocal, useNow,
    toast, copy, Reveal, CountUp, Stat, Chapter, Button, Nav, CommandPalette, ContactForm, Footer,
    OpenBadge, HoursTable, openStatus, fmtH, DAYS, MapCard, FAQ, ActionBar, mount,
  };
})();
