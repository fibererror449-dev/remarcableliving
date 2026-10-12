type DescriptionSection = {
  title: string;
  paragraphs: string[];
};

const sectionRules: Array<{ title: string; matches: RegExp }> = [
  { title: "Nearby universities", matches: /\b(universit|campus|students)\b/i },
  { title: "Getting around", matches: /\b(MRT|BTS|station|road|walk|metres|meters|kilometres|kilometers|km|transit)\b/i },
  { title: "Building amenities", matches: /\b(amenit|facilit|pool|Jacuzzi|gym|co-working|lounge|garden|CCTV|security)\b/i },
  { title: "Availability", matches: /\b(availability|available|rented|viewing|confirm)\b/i },
];

function groupDescription(description: string): DescriptionSection[] {
  const sentences = description
    .split(/\n+/)
    .flatMap((paragraph) => paragraph.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((sentence) => sentence.replace(/^[-*\s]+|[-*\s]+$/g, "").trim())
    .filter((sentence) => sentence && !/^Residence details$/i.test(sentence));
  const sections = new Map<string, string[]>();

  for (const sentence of sentences) {
    const rule = sectionRules.find(({ matches }) => matches.test(sentence));
    const title = rule?.title ?? "The residence";
    sections.set(title, [...(sections.get(title) ?? []), sentence]);
  }

  const order = ["The residence", ...sectionRules.map(({ title }) => title)];
  return order.flatMap((title) => {
    const paragraphs = sections.get(title);
    return paragraphs?.length ? [{ title, paragraphs }] : [];
  });
}

export default function ResidenceDescription({ description }: { description: string }) {
  const sections = groupDescription(description);
  return <div className="residence-description">
    {sections.map((section) => <section className="residence-description-section" key={section.title}>
      <h2>{section.title}</h2>
      {section.paragraphs.map((paragraph, index) => <p key={`${section.title}-${index}`}>{paragraph}</p>)}
    </section>)}
  </div>;
}
