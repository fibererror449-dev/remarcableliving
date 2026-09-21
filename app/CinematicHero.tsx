"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./cinematic-hero.css";
import ListingImage from "./ListingImage";
import BrandLogo from "./components/BrandLogo";
import { studentHousingHref } from "../lib/site-data";

type Listing = { id: number; slug: string; name: string; district: string; rent: number; image: string; bedrooms: number; sizeSqm: number };
const featuredUniversities = [
  { name: "Chulalongkorn University", image: "/bangkok/green-condo.jpg", location: "Pathum Wan" },
  { name: "KU Kasetsart University", image: "/properties/baan-klang-krung-siam.jpg", location: "Bang Khen" },
  { name: "Thammasat University", image: "/bangkok/night-city.jpg", location: "Tha Prachan & Rangsit" },
];
const scenes = [
  { name: "Bangkok", file: "bangkok", at: 0, title: "Arrive in Bangkok.", line: "Feel at home." },
  { name: "Living room", file: "living-natural", at: .655, title: "Room to settle in.", line: "A place to be you." },
  { name: "Bedroom", file: "bedroom-natural", at: .755, title: "Leave the city outside.", line: "Rest comes naturally." },
  { name: "Kitchen", file: "kitchen-natural", at: .855, title: "Make yourself at home.", line: "One morning at a time." },
  { name: "Balcony", file: "balcony-natural", at: .975, title: "Your next chapter starts", line: "with a place to call home." },
];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const ramp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));

export default function CinematicHero({ listings, onExploreArea, children }: { listings: Listing[]; onExploreArea: (area: string) => void; children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLDivElement>(null);
  const destination = useRef<HTMLDivElement>(null);
  const sceneImages = useRef<(HTMLImageElement | null)[]>([]);
  const [phase, setPhase] = useState(0);
  const [room, setRoom] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [area, setArea] = useState("Ari");
  const [selected, setSelected] = useState<number | null>(null);
  const [motionOff, setMotionOff] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [copyVisible, setCopyVisible] = useState(true);
  const [manualMotionOff, setManualMotionOff] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const filtered = listings.filter((item) => item.district === area);
  const featured = filtered.find((item) => item.id === selected) ?? filtered[0] ?? listings[0];

  useEffect(() => {
    let alive = true;
    Promise.all(scenes.map(({ file }) => new Promise<void>((resolve, reject) => {
      const img = new Image(); img.onload = () => { img.decode().then(resolve, reject); }; img.onerror = reject; img.src = `/hero/${file}.webp`;
    }))).then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setLoadFailed(true); });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOff(media.matches);
    update(); media.addEventListener("change", update);
    return () => { alive = false; media.removeEventListener("change", update); };
  }, []);

  // Reserve the story's layout while imagery loads. Switching from a short
  // static page after load would move restored scroll positions into a room.
  const staticMode = motionOff || manualMotionOff || loadFailed;

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const stage = root.querySelector<HTMLElement>(".cinema-stage")!;
      const viewport = root.querySelector<HTMLElement>(".cinema-viewport")!;
      const w = viewport.clientWidth, h = viewport.clientHeight;
      const contentHeight = Math.max(h, (destination.current?.firstElementChild as HTMLElement | null)?.offsetHeight ?? h);
      root.style.setProperty("--destination-height", `${contentHeight}px`);
      const progress = staticMode ? 0 : clamp(-bounds.top / Math.max(1, root.offsetHeight - stage.offsetHeight));
      // The final 16% returns through the laptop into the actual, live collection.
      const p = clamp(progress / .84);
      const finale = staticMode ? 0 : ramp(progress, .855, .99);
      const mobile = w < 700;
      const pw = Math.max(w, h * (1672 / 941));
      const ph = pw * 941 / 1672;
      // The photo and its HTML screen share one camera. The HTML layout is
      // fixed-size; only its transform changes, so type never reflows mid-zoom.
      const left = (w - pw) / 2, top = (h - ph) / 2;
      const sw = pw * .233, sh = ph * .262;
      // Interior photos have different bezels. These conservative rectangles
      // sit inside the narrowest part of each screen, not its outer lid.
      const livingMix = ramp(p, .55, .578);
      const screenX = .372 + (628 / 1672 - .372) * livingMix;
      const screenY = .529 + (502 / 941 - .529) * livingMix;
      const screenW = .233 + (374 / 1672 - .233) * livingMix;
      const screenH = .262 + (232 / 941 - .262) * livingMix;
      const balconyX = 632 / 1672, balconyY = 504 / 941;
      const balconyW = pw * (370 / 1672), balconyH = ph * (230 / 941);
      const sx = left + pw * balconyX, sy = top + ph * balconyY;
      const inset = mobile ? 0 : 34;
      const navHeight = mobile ? 72 : 86;
      const targetW = w - inset * 2, targetH = h - navHeight - (mobile ? 44 : 52);
      const enter = ramp(p, .045, .23);
      const leave = ramp(p, .54, .645);
      const zoom = enter * (1 - leave);
      const introScale = 1 + (targetW / sw - 1) * zoom;
      const cameraScale = introScale + (w / balconyW - introScale) * finale;
      const introX = left + (inset - pw * .372 * (targetW / sw) - left) * zoom;
      const introY = top + (navHeight - ph * .529 * (targetW / sw) - top) * zoom;
      const cameraX = introX + (-pw * balconyX * (w / balconyW) - introX) * finale;
      const cameraY = introY + (-ph * balconyY * (w / balconyW) - introY) * finale;
      if (plane.current) {
        Object.assign(plane.current.style, {
          width: `${pw}px`, height: `${ph}px`, left: "0px", top: "0px",
          transformOrigin: "0 0",
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${cameraScale})`,
        });
      }
      const reveal = ramp(p, .23, .28) * (1 - leave);
      const screenScale = pw * screenW * introScale / targetW;
      const photographedHeight = ph * screenH * targetW / (pw * screenW);
      const layoutHeight = Math.max(targetH, photographedHeight);
      if (screen.current) {
        screen.current.style.setProperty("--screen-layout-height", `${targetH}px`);
        Object.assign(screen.current.style, {
        left: "0px", top: "0px", width: `${targetW}px`, height: `${layoutHeight}px`,
        transform: `translate3d(${introX + pw * screenX * introScale}px, ${introY + ph * screenY * introScale}px, 0) scale(${screenScale})`,
        // Portrait screens need more page height than the laptop lid offers.
        // Keep the page inside the bezel while the laptop is still visible as
        // a laptop; the extra height is revealed only once the zoom is
        // complete, over a darkened room, so it never spills onto the keyboard.
        clipPath: `inset(0 0 ${(layoutHeight - photographedHeight) * (1 - reveal * (1 - livingMix))}px 0)`,
        // Reveal the laptop UI only after the readable hero copy has faded.
        opacity: String(staticMode ? 0 : ramp(p, .09, .15) * (1 - ramp(p, .635, .67))),
        });
      }
      if (backdrop.current) backdrop.current.style.opacity = String(layoutHeight > photographedHeight + 1 ? reveal * (1 - ramp(p, .635, .67)) : 0);
      let roomIndex = 0;
      if (p >= .55) roomIndex = 1;
      if (p >= .715) roomIndex = 2;
      if (p >= .815) roomIndex = 3;
      if (p >= .905) roomIndex = 4;
      setRoom((old) => old === roomIndex ? old : roomIndex);
      const nextPhase = p < .275 ? 0 : p < .385 ? 1 : p < .49 ? 2 : 3;
      setPhase((old) => old === nextPhase ? old : nextPhase);
      const transitions = [0, .55, .715, .815, .905];
      sceneImages.current.forEach((img, index) => {
        if (!img) return;
        const entering = index === 0 || p >= transitions[index];
        const covered = index < scenes.length - 1 && p >= transitions[index + 1] + .028;
        // Only the current crossfade pair needs a painted image surface.
        img.style.visibility = entering && !covered ? "visible" : "hidden";
        img.style.opacity = index === 0 ? "1" : String(ramp(p, transitions[index], transitions[index] + .028));
      });
      const copyOpacity = (p < .55 ? 1 - ramp(p, .015, .09) : ramp(p, .63, .67)) * (1 - ramp(progress, .845, .89));
      if (copy.current) copy.current.style.opacity = String(copyOpacity);
      setCopyVisible((old) => old === (copyOpacity > .1) ? old : copyOpacity > .1);
      if (progressBar.current) progressBar.current.style.transform = `scaleX(${progress})`;
      root.style.setProperty("--finale-chrome", String(1 - ramp(progress, .86, .94)));
      setChromeVisible((old) => old === (progress < .94) ? old : progress < .94);
      const content = destination.current;
      if (content) {
        const inFlow = staticMode || progress >= 1;
        const visible = staticMode || progress >= .81;
        const interactive = staticMode || progress >= .99;
        const contentScale = balconyW / w + (1 - balconyW / w) * finale;
        // Do not interpolate the mask height independently of the photograph:
        // that lets the web page grow down across the physical bezel.
        const clipHeight = finale === 1 ? h : balconyH / (balconyW / w);
        Object.assign(content.style, {
          // This is inside the same CSS sticky stage, never counter-translated
          // against document scrolling. At 1 the stage releases natively.
          transform: inFlow ? "none" : `translate3d(${sx * (1 - finale)}px, ${sy * (1 - finale)}px, 0) scale(${contentScale})`,
          // Bound the composited surface to the visible laptop page, not the
          // entire inventory. Huge clipped textures can flash black on scroll.
          height: `${inFlow ? contentHeight : clipHeight}px`,
          willChange: visible && !inFlow ? "transform" : "auto",
          opacity: String(staticMode ? 1 : ramp(progress, .81, .83)),
          visibility: visible ? "visible" : "hidden",
          pointerEvents: interactive ? "auto" : "none",
        });
        content.inert = !interactive;
        content.setAttribute("aria-hidden", String(!interactive));
      }
      root.dataset.phase = String(nextPhase);
      root.dataset.room = String(roomIndex);
      root.dataset.progress = progress.toFixed(3);
    };
    const requestPaint = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const observer = new ResizeObserver(requestPaint);
    observer.observe(root.querySelector<HTMLElement>(".cinema-viewport")!);
    if (destination.current?.firstElementChild) observer.observe(destination.current.firstElementChild);
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint);
    paint();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", requestPaint); window.removeEventListener("resize", requestPaint); };
  }, [staticMode]);

  function goTo(p: number) {
    if (!section.current) return;
    const root = section.current;
    const stageHeight = root.querySelector<HTMLElement>(".cinema-stage")!.clientHeight;
    window.scrollTo({ top: window.scrollY + root.getBoundingClientRect().top + p * .84 * (root.offsetHeight - stageHeight), behavior: motionOff ? "instant" : "smooth" });
  }
  const uiInteractive = !staticMode && phase > 0 && room === 0;
  const showCopy = staticMode || copyVisible;
  const activeScene = scenes[room];

  return (
    <>
    <section ref={section} className={`cinema ${staticMode ? "cinema-static" : ""}`} id="home" aria-label="From Bangkok to your next home">
      <div className="cinema-stage">
      <div className="cinema-viewport">
        <div className="cinema-plane" ref={plane} aria-hidden="true">
          {scenes.map((scene, index) => <img key={scene.file} ref={(el) => { sceneImages.current[index] = el; }} className="cinema-photo" src={`/hero/${scene.file}.webp`} alt="" fetchPriority={index === 0 ? "high" : "auto"} style={{ opacity: index ? 0 : 1 }} />)}
        </div>
        <div className="cinema-shade" aria-hidden="true" />
        <div className="cinema-backdrop" ref={backdrop} aria-hidden="true" />
        <header className="cinema-nav" inert={!chromeVisible}>
          <a className="cinema-brand" href="#home" aria-label="REMARCABLE LIVING home" onClick={() => setMenuOpen(false)}><BrandLogo /></a>
          <button className="cinema-menu" aria-expanded={menuOpen} aria-controls="cinema-links" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
          <nav id="cinema-links" className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
            <a href={studentHousingHref}>Your University</a>
            <a href="#residences" onClick={() => setMenuOpen(false)}>Condo/Apartment</a>
            <a href="/neighbourhoods">Neighbourhoods</a>
            <a href="/neighbourhoods#guide">Bangkok guide</a>
            <a href="/about">About Us</a>
            <a className="cinema-menu-contact" href="/contact">Mark your place, Find your space.</a>
          </nav>
          <a className="cinema-contact" href="/contact">Mark your place, Find your space.</a>
        </header>

        <div ref={copy} className={`cinema-copy ${room > 0 ? "is-room" : ""}`} inert={!showCopy}>
          <p className="cinema-eyebrow">{room === 0 ? "Leave your finding room behind, just enjoy Bangkok." : room === 4 ? "Chao Phraya · Bangkok" : `At home in Bangkok · ${activeScene.name}`}</p>
          {room === 0 ? <h1>{activeScene.title}<br /><em>{activeScene.line}</em></h1> : <h2>{activeScene.title}<br /><em>{activeScene.line}</em></h2>}
          {room === 0 && <p className="cinema-intro">We’ll handle everything—from before you arrive, to the moment you land, right up to your new front door.</p>}
          {room === 4 && <p className="cinema-ending">New streets. Familiar comforts. A life that feels like yours.<br /><span>Keep scrolling to find a home that fits your life—and your budget.</span></p>}
          {room === 0 && <div className="cinema-actions">
            <a className="cinema-primary" href={studentHousingHref}>Find by university</a>
            <a className="cinema-secondary" href="#residences">Explore units</a>
          </div>}
        </div>

        <div className="cinema-screen" ref={screen} inert={!uiInteractive} aria-hidden={!uiInteractive}>
          <div className="screen-masthead"><BrandLogo /></div>
          <div className={`screen-panel panel-welcome ${phase === 0 ? "is-active" : ""}`} inert={phase !== 0}>
            <img src="/bangkok/green-condo.jpg" alt="" />
            <div><p className="screen-kicker">Your Bangkok chapter</p><h2>A city of possibilities.<br /><em>One place for you.</em></h2><p>Start with the neighbourhood.<br />Find the home that fits.</p></div>
          </div>
          <div className={`screen-panel panel-discovery ${phase === 1 ? "is-active" : ""}`} inert={phase !== 1}>
            <p className="screen-kicker">First, select your university</p><h2>Which university<br /><em>earned your spot?</em></h2>
            <div className="screen-area-grid">{featuredUniversities.map((item) => <a key={item.name} href={`/student-housing?university=${encodeURIComponent(item.name)}#student-intake`}>
              <img src={item.image} alt="" /><span><small>{item.location}</small><strong>{item.name}</strong><b>Explore units</b></span>
            </a>)}</div>
            <p className="screen-footnote">Choose your university to update your exchange brief, or keep scrolling to explore the current collection.</p>
          </div>
          <div className={`screen-panel panel-discovery ${phase === 2 ? "is-active" : ""}`} inert={phase !== 2}>
            <p className="screen-kicker">{area} · Your shortlist</p><h2>Find a place<br /><em>to call your own.</em></h2><p className="screen-panel-note">Here for six months? Just pick up the phone and WhatsApp Mark.</p>
            <div className="screen-listing-grid">{filtered.slice(0, 3).map((item) => <button key={item.id} className={featured?.id === item.id ? "is-selected" : ""} onClick={() => { setSelected(item.id); goTo(.515); }}>
              <ListingImage src={item.image} alt={item.name} /><span><small>{item.bedrooms} bed · {item.sizeSqm} sq m</small><strong>{item.name}</strong><b>฿{item.rent.toLocaleString()} / month</b></span>
            </button>)}</div>
            <p className="screen-footnote">Asking rents shown. Confirm availability with Mark.</p>
          </div>
          <div className={`screen-panel panel-selected ${phase === 3 ? "is-active" : ""}`} inert={phase !== 3}>
            <ListingImage src={featured?.image ?? "/bangkok/green-condo.jpg"} alt={featured?.name ?? "Bangkok residence"} />
            <div><p className="screen-kicker">A home to consider</p><h2>{featured?.name}</h2><p>{featured?.district} · ฿{featured?.rent.toLocaleString()} / month</p>{featured ? <a href={`/residences/${featured.slug}`}>View residence details</a> : <a href="/residences">Browse residences</a>}<p className="screen-footnote">Next: imagine life at home.<br />The following rooms are AI-created inspiration,<br />not photographs of this listing.</p></div>
          </div>
        </div>

        <div className="cinema-bottom" inert={!chromeVisible}>
          <span className="cinema-caption">{room === 0 ? "Bangkok, Thailand" : "AI-created interiors · A vision of life here"}</span>
          {!staticMode && <div className="cinema-chapters" aria-label="Explore the story">
            <button onClick={() => goTo(.305)} aria-current={phase === 1 && room === 0 ? "step" : undefined}>Neighbourhoods</button>
            <button onClick={() => goTo(.425)} aria-current={phase === 2 && room === 0 ? "step" : undefined}>Apartments</button>
            {scenes.slice(1).map((item, i) => <button key={item.file} onClick={() => goTo(item.at)} aria-current={room === i + 1 ? "step" : undefined}>{item.name}</button>)}
          </div>}
          <div className="cinema-utilities">
            {ready && !loadFailed && !motionOff && <button className="cinema-motion-toggle" aria-pressed={manualMotionOff} onClick={() => {
              window.scrollTo({ top: 0, behavior: "instant" });
              setManualMotionOff(!manualMotionOff);
            }}>{manualMotionOff ? "Play story" : "Reduce motion"}</button>}
            <a className="cinema-skip" href="#search">Skip to search</a>
          </div>
        </div>
        {!staticMode && <div ref={progressBar} className="cinema-progress" aria-hidden="true" />}
      </div>
      {staticMode && ready && <div className="cinema-motion-note"><p>Explore Bangkok at your own pace.</p><button onClick={() => onExploreArea(area)}>Browse {area} residences</button></div>}
    <div ref={destination} className={`cinema-destination ${staticMode ? "is-static" : ""}`}>{children}</div>
      </div>
    </section>
    </>
  );
}
