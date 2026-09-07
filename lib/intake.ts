import { whatsappUrl } from "./site-data";

export type Persona = "exchange" | "intern";

export function whatsappHref(text: string) {
  return `${whatsappUrl}?text=${encodeURIComponent(text)}`;
}

// Returns null when the required fields are missing.
export function buildIntakeMessage(persona: Persona, form: FormData, listingName?: string): string | null {
  const name = String(form.get("name") ?? "").trim();
  const contact = String(form.get("contact") ?? "").trim();
  const budgetValue = String(form.get("budget") ?? "").trim() || "not specified";
  const note = String(form.get("note") ?? "").trim() || "not specified";
  if (!name || !contact) return null;

  const lines: string[] = [`Hi Mark, I’m ${name} (${contact}).`];
  if (persona === "exchange") {
    const university = String(form.get("university") ?? "not specified");
    const program = String(form.get("exchangeProgram") ?? "not specified");
    const startDate = String(form.get("startDate") ?? "not specified");
    const roomType = String(form.get("roomType") ?? "not specified");
    lines.push(
      "I’m applying as an exchange student.",
      `University/school: ${university}.`,
      `Program: ${program}.`,
      `Preferred start date: ${startDate}.`,
      `Room setup: ${roomType}.`,
    );
  } else {
    const workplace = String(form.get("workplace") ?? "not specified");
    const internRole = String(form.get("internRole") ?? "not specified");
    const duration = String(form.get("duration") ?? "not specified");
    const startDate = String(form.get("startDate") ?? "not specified");
    lines.push(
      "I’m reaching out through the intern intake path.",
      `Workplace: ${workplace}.`,
      `Role: ${internRole}.`,
      `Expected start date: ${startDate}.`,
      `Placement duration: ${duration}.`,
    );
  }
  lines.push(`Target budget: ${budgetValue}.`, `Must-haves/notes: ${note}.`);
  if (listingName) lines.push(`Listing of interest: ${listingName}.`);
  return lines.join(" ");
}
