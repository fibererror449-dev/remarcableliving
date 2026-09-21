// Client-safe site constants and editorial data shared across pages.

export const siteOrigin = "https://www.remarcableliving.co";
export const whatsappNumber = "66634962466";
export const whatsappUrl = `https://wa.me/${whatsappNumber}`;
export const studentHousingHref = "/student-housing";

export const neighbourhoods = [
  { name: "Ari", transit: "BTS Ari", image: "/bangkok/green-condo.jpg", note: "Start with the commute, then compare space and monthly rent." },
  { name: "Ratchathewi", transit: "BTS Ratchathewi", image: "/properties/baan-klang-krung-siam.jpg", note: "A central search anchored around verified unit details." },
  { name: "Thonglor", transit: "BTS Thong Lo", image: "/bangkok/night-city.jpg", note: "Compare the full door-to-door journey, not the district name alone." },
  { name: "Rama 9", transit: "MRT Phra Ram 9", image: "/bangkok/skyline.jpg", note: "Review rent, usable space, and station access side by side." },
];

export const universityOptions = [
  "Chulalongkorn University",
  "Mahidol University",
  "Srinakharinwirot University",
  "Kasem Bundit University",
  "Bangkok University",
  "UTCC",
  "KU Kasetsart University",
  "Dhurakij Pundit University",
  "Thammasat University, Tha Prachan Campus",
  "Thammasat University, Rangsit Campus",
  "Another Bangkok university",
];

export const workplaceOptions = [
  "Silom / Sathorn",
  "Sukhumvit business district",
  "Rama 9 / Asok",
  "Thong Lo / Ekkamai",
  "Ari / Phahonyothin",
  "Phrom Phong / Ekkamai",
  "On Nut",
  "Other area",
];

export const journeySteps = [
  { title: "Brief", note: "Share your workplace, budget, move-in date, and non-negotiables." },
  { title: "Compare", note: "Review area, commute, unit condition, space, and asking rent together." },
  { title: "Confirm", note: "Reconfirm current availability and asking rent before arranging a visit." },
  { title: "View", note: "Visit the strongest options and continue with the home that fits." },
];

export const aboutValues = [
  { title: "We only shortlist what we would view ourselves", note: "Every home on your list has been compared on building, commute, unit condition, and asking rent. If it falls short on any of the four, it does not go on the list." },
  { title: "Availability and rent are confirmed before you travel", note: "Bangkok listings go stale quickly. We reconfirm that the unit is still available and what the owner is asking before we arrange a viewing." },
  { title: "The commute is measured door to door", note: "A district name says little about your day. We look at the walk to the station, the line you will ride, and the time to your campus or office." },
  { title: "The decision stays yours", note: "We answer questions, arrange viewings, and help with the steps to move-in. We do not push a unit because it is convenient for us." },
];

export const exploreTiles = [
  { title: "Neighbourhoods", note: "Compare Ari, Ratchathewi, Thonglor and Rama 9 by commute, space and rent.", href: "/neighbourhoods" },
  { title: "About us", note: "Who we are, what we stand for, and how a brief becomes a home.", href: "/about" },
  { title: "Bangkok guide", note: "What to know about the area before you sign for the room.", href: "/neighbourhoods#guide" },
  { title: "Talk to Mark", note: "Send your requirements and get a practical shortlist back.", href: "/contact" },
];

export const guideNotes = [
  { title: "Your best district protects your daily time", note: "Compare areas by the door-to-door journey, not the brochure.", cta: "Compare areas", href: "/residences" },
  { title: "Check the walk, not just the station name", note: "Walking times are estimates and are checked during the viewing.", cta: "See neighbourhoods", href: "/neighbourhoods#neighbourhoods" },
  { title: "Asking rent is confirmed before you travel", note: "Availability and negotiated rent are reconfirmed before any viewing.", cta: "Talk to Mark", href: "/contact" },
];
