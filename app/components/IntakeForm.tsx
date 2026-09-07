"use client";

import { useState, type FormEvent } from "react";
import { buildIntakeMessage, whatsappHref, type Persona } from "../../lib/intake";
import { universityOptions, workplaceOptions } from "../../lib/site-data";

type Props = {
  initialPersona?: Persona;
  /** Which intake paths to offer. A single persona renders no tab switcher. */
  personas?: Persona[];
  /** Listing the visitor arrived from; shown as a notice and appended to the message. */
  listingName?: string;
  /** Preselected university for the exchange form. */
  university?: string;
};

export default function IntakeForm({ initialPersona = "exchange", personas = ["exchange", "intern"], listingName, university }: Props) {
  const [persona, setPersona] = useState<Persona>(personas.includes(initialPersona) ? initialPersona : personas[0]);
  const [notice, setNotice] = useState(listingName ? `Viewing request started for ${listingName}.` : "");

  function handleSubmit(event: FormEvent<HTMLFormElement>, activePersona: Persona) {
    event.preventDefault();
    const message = buildIntakeMessage(activePersona, new FormData(event.currentTarget), listingName);
    if (!message) {
      setNotice("Please include your name and contact details before continuing.");
      return;
    }
    window.open(whatsappHref(message), "_blank");
    setNotice("Opening WhatsApp to send your tailored intake details.");
  }

  return (
    <div className="concierge-card">
      {notice && <div className="notice" role="status">{notice}</div>}
      {personas.length > 1 && <div className="intake-switcher" role="tablist" aria-label="Choose intake path">
        <button type="button" role="tab" aria-selected={persona === "exchange"} aria-controls="exchange-intake" onClick={() => setPersona("exchange")}>Exchange student</button>
        <button type="button" role="tab" aria-selected={persona === "intern"} aria-controls="intern-intake" onClick={() => setPersona("intern")}>Intern</button>
      </div>}
      {personas.includes("exchange") && <form id="exchange-intake" role={personas.length > 1 ? "tabpanel" : undefined} hidden={persona !== "exchange"} onSubmit={(event) => handleSubmit(event, "exchange")} className="concierge-form">
        <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
        <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
        <label><span>Target budget</span><input required name="budget" placeholder="฿24,000 / month" /></label>
        <label><span>University or school</span><select required name="university" defaultValue={university && universityOptions.includes(university) ? university : ""}><option value="">Select your university</option>{universityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>Program format</span><input name="exchangeProgram" placeholder="Exchange semester / summer programme" /></label>
        <label><span>Expected start date</span><input name="startDate" type="month" /></label>
        <label><span>Room setup</span><input name="roomType" placeholder="Single studio / shared room" /></label>
        <label><span>Must-haves</span><input name="note" placeholder="Quiet floor, fast internet" /></label>
        <button className="btn gold" type="submit">Exchange intake to Mark <span>↗</span></button>
      </form>}
      {personas.includes("intern") && <form id="intern-intake" role={personas.length > 1 ? "tabpanel" : undefined} hidden={persona !== "intern"} onSubmit={(event) => handleSubmit(event, "intern")} className="concierge-form">
        <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
        <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
        <label><span>Target budget</span><input required name="budget" placeholder="฿18,000 / month" /></label>
        <label><span>Workplace</span><select required name="workplace" defaultValue=""><option value="">Select workplace area</option>{workplaceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>Intern role / focus</span><input name="internRole" placeholder="Design / product / operations" /></label>
        <label><span>Expected start date</span><input name="startDate" type="month" /></label>
        <label><span>Placement duration</span><input name="duration" placeholder="3 to 6 months" /></label>
        <label><span>Must-haves</span><input name="note" placeholder="Early commute windows, quiet study area" /></label>
        <button className="btn gold" type="submit">Intern intake to Mark <span>↗</span></button>
      </form>}
    </div>
  );
}
