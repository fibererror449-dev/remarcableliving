const notes = [
  { title: "Your best district protects your daily time", note: "Compare areas by the door-to-door journey, not the brochure.", cta: "Compare areas", href: "#search" },
  { title: "Check the walk, not just the station name", note: "Walking times are estimates and are checked during the viewing.", cta: "See neighbourhoods", href: "#neighbourhoods" },
  { title: "Asking rent is confirmed before you travel", note: "Availability and negotiated rent are reconfirmed before any viewing.", cta: "Talk to Mark", href: "#assist" },
];

export default function BeforeYouSign() {
  return (
    <section className="before-sign section reveal delay-2" id="journal" data-reveal>
      <div className="container before-sign-grid">
        <div className="before-sign-head">
          <p className="eyebrow"><span /> Know Bangkok before you sign</p>
          <h2 className="h2">Choose the area.<br />Then the <em>room.</em></h2>
        </div>
        <div className="before-sign-list">
          {notes.map((item) => (
            <a key={item.href} href={item.href}>
              <span><strong>{item.title}</strong><span className="meta">{item.note}</span></span>
              <span className="text-link">{item.cta} →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
