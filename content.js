/* ================================================================
   ALL-AM MACHINING — site content
   Public info is thin. Confirmed in listings: name, phone, fax,
   Tracy 95304. EVERYTHING marked // CONFIRM must be checked by phone.

   ADDRESS — listings disagree. Pick the right one before launch:
     • 8898 W Schulte Rd, Tracy 95304   (Bing, Superpages, Cortera, MapQuest)
     • 280 W Larch Rd, Ste 102          (Chamber, Macrae's Blue Book)
     • 4160 Commercial Dr, Ste A        (Yelp — same phone as A & K Machining)
================================================================ */
window.SITE = {
  biz: {
    name: "All-Am Machining",
    short: "All-Am Machining",
    legal: "All-Am Machining, Inc.",
    tag: "Machine shop · Tracy, CA",
    phone: "(209) 833-1302",
    fax: "(209) 833-1307",
    email: "",
    address: "8898 W Schulte Rd, Tracy, CA 95304", // CONFIRM (see note above)
    addressNote: "Call ahead before dropping off parts",
    footer: "A Tracy machine shop. Call with a print, a sample part, or a problem — we'll tell you what it takes.",
  },

  hours: null, // CONFIRM

  nav: [
    { id: "work", label: "The work", hint: "What to call us about" },
    { id: "traveler", label: "Job traveler", hint: "Spec your job" },
    { id: "fax", label: "Fax a print", hint: "Cover sheet, ready to send" },
    { id: "sample", label: "Copy a part", hint: "Bring the old one" },
    { id: "contact", label: "Contact", hint: "Phone, fax, location" },
  ],

  // CONFIRM all four with the owner.
  work: [
    { n: "01", t: "CNC milling", d: "Brackets, plates, blocks and housings cut to your print." },
    { n: "02", t: "CNC turning", d: "Shafts, bushings, spacers and threaded parts." },
    { n: "03", t: "Replacement parts", d: "Worn or broken and no longer made? We measure the original and make a new one." },
    { n: "04", t: "Short runs", d: "From one-offs to repeat orders you can count on." },
  ],

  ops: ["Mill", "Turn", "Drill & tap", "Deburr", "Inspect", "Outside finish (anodize, plate, paint)"],
  materials: ["Aluminum", "Mild steel", "Alloy steel", "Stainless", "Brass / bronze", "Plastic", "Not sure"],

  sample: [
    "The worn or broken part — even in pieces",
    "The part it mates with, if you can",
    "What it's from: machine make, model, serial",
    "How it failed, and how many you need",
  ],

  faq: [
    { q: "Do you take one-off jobs?", a: "Call and describe it. A single part is often exactly what a local shop is for." }, // CONFIRM
    { q: "How do I send a drawing?", a: "Fax it to (209) 833-1307 with the cover sheet on this page, or call and we'll tell you the best way." },
    { q: "Can I drop by?", a: "Please call (209) 833-1302 first so someone's free to look at your part." },
  ],

  links: [
    { label: "Yelp listing", href: "https://www.yelp.com/biz/all-am-machining-tracy" },
    { label: "Tracy Chamber of Commerce", href: "https://www.tracychamber.org/" },
  ],

  titleBlock: [
    ["Shop", "ALL-AM MACHINING"],
    ["Phone", "209 833-1302"],
    ["Fax", "209 833-1307"],
    ["City", "TRACY, CA 95304"],
    ["Sheet", "1 OF 1"],
  ],
  colophon: "Set in Zilla Slab, Public Sans and Red Hat Mono · Built with React",
  searchPlaceholder: "Search: fax, milling, replacement part…",
};
