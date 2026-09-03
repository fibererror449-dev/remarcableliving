export type ListingStory = {
  title: string;
  opening: string;
  highlights: string[];
  idealFor: string;
  neighbourhood: string;
  nearby: Array<{ name: string; note: string }>;
};

const stories: Record<string, ListingStory> = {
  "ashton-asoke-3br-42f": {
    title: "A singular high-floor home above the heart of Asoke.",
    opening: "This rare 100 sq m residence pairs a true three-bedroom, three-bathroom plan with Ashton Asoke's signature curved glass. From the 42nd floor, the city opens in an uninterrupted panorama, while the fully decorated interior is ready to live in from day one.",
    highlights: [
      "The only unit of its type in the building offers a genuinely uncommon opportunity in central Asoke.",
      "Curved floor-to-ceiling windows turn the living and dining space into a private observatory above Bangkok.",
      "Premium furnishings, considered decoration, and a complete set of electrical appliances are included.",
    ],
    idealFor: "A family, senior executive, or international tenant who needs three proper bedrooms without giving up immediate MRT and BTS access, and who values a distinctive home rather than a standard high-rise layout.",
    neighbourhood: "Asoke is one of Bangkok's most connected addresses. MRT Sukhumvit is approximately 20 metres away and BTS Asok approximately 230 metres away, placing offices, international schools, healthcare, dining, and green space within an unusually easy daily radius.",
    nearby: [
      { name: "Terminal 21 Asok", note: "Shopping, dining, groceries, cinema, and everyday services beside the BTS interchange." },
      { name: "Benjakitti Park", note: "A major city park for walking, running, cycling, and open-air time close to home." },
      { name: "NIST International School", note: "A leading international school within the wider Asoke and Sukhumvit neighbourhood." },
      { name: "Bumrungrad International Hospital", note: "International healthcare accessible from the Sukhumvit corridor." },
    ],
  },
  "baan-klang-krung-siam-2br": {
    title: "A proper two-bedroom home at the edge of Siam.",
    opening: "Baan Klang Krung Siam gives central-city living the proportions of a real home. Across 74 sq m, the living room, dining table, kitchen, and two bedrooms each have a clear purpose, while the 21st-floor position brings daylight and a broad urban outlook.",
    highlights: [
      "Two distinct bedrooms make the layout useful for a couple, flatmates, a small family, or a dedicated work room.",
      "The open living, dining, and kitchen zone has space for full-size appliances and meals at a proper table.",
      "Large windows and the high-floor setting bring the city into view without making the home feel exposed.",
    ],
    idealFor: "A couple who wants a second bedroom for work or guests, two professionals sharing a central home, or a small family that values usable space and a very short BTS connection.",
    neighbourhood: "Ratchathewi is the practical threshold of Siam: close to the city's main shopping, education, and cultural district while remaining one BTS stop away from Siam interchange. The owner-supplied video describes the station walk as approximately three minutes.",
    nearby: [
      { name: "BTS Ratchathewi", note: "The owner's video estimates a three-minute walk; confirm the route during a viewing." },
      { name: "Siam district", note: "Shopping, dining, cinemas, and the Siam BTS interchange are one station away." },
      { name: "BACC & MBK", note: "A nearby arts, shopping, and dining cluster around National Stadium." },
    ],
  },
  "centurion-park-ari-soi-5-1br": {
    title: "An Ari home with room for the day to unfold.",
    opening: "Centurion Park feels generous in a way most one-bedroom city homes do not. The renovated 62 sq m layout creates a clear place to sleep, work, cook, and step outside without making any one part of the home feel squeezed.",
    highlights: [
      "A separate sleeping area keeps work and rest from sharing the same corner.",
      "The full kitchen and open living space suit evenings spent properly at home.",
      "A private balcony adds daylight and a pause from the pace of the city.",
    ],
    idealFor: "A solo renter or couple who works from home, wants the quieter character of Ari Soi 5, and values real living space more than a brand-new tower.",
    neighbourhood: "Ari balances residential streets with cafés, small restaurants, and an easy route back to the BTS. This address sits inside the neighbourhood rather than directly above its busiest junction.",
    nearby: [
      { name: "BTS Ari", note: "The nearest rapid-transit connection; walking time should be confirmed during a viewing." },
      { name: "La Villa Ari", note: "Groceries, dining, and everyday services beside the station." },
      { name: "Ari Soi 5", note: "A calmer residential pocket with local cafés and neighbourhood dining." },
    ],
  },
  "centric-ari-station-1br": {
    title: "A compact Ari base that keeps the city close.",
    opening: "This 28 sq m one-bedroom is designed for a life that moves through Bangkok easily. The high-floor setting gives the compact plan a sense of separation from the street, while the short walk to BTS Ari keeps the daily commute simple.",
    highlights: [
      "A defined one-bedroom layout gives sleep its own space in a compact footprint.",
      "The 17th-floor position brings the benefits of a higher city outlook.",
      "A short route to BTS Ari protects time on workdays and evenings out.",
    ],
    idealFor: "A solo professional who wants a low-maintenance home, spends plenty of time in the city, and prefers transport convenience over extra floor area.",
    neighbourhood: "The building places Ari's daily conveniences within easy reach while keeping connections to Siam and central Bangkok straightforward from the BTS line.",
    nearby: [
      { name: "BTS Ari", note: "The neighbourhood's main connection to central Bangkok." },
      { name: "Vanit Village", note: "A nearby stop for food, coffee, and practical errands." },
      { name: "Villa Market Phahonyothin", note: "A grocery option within the wider Ari area." },
    ],
  },
  "noble-around-ari-1br": {
    title: "A polished city base at the front door of Ari.",
    opening: "Noble Around Ari is for someone who wants the neighbourhood without adding a long walk to every journey. The 26.58 sq m home is compact and contemporary, with a high-floor position and the BTS only moments away.",
    highlights: [
      "The location is approximately 90 metres from BTS Ari according to the developer.",
      "A modern one-bedroom plan keeps the home focused and easy to maintain.",
      "High-floor living creates distance from the movement of Phahonyothin Road below.",
    ],
    idealFor: "A solo professional who values a very short BTS walk, likes having cafés and dinner options close by, and is comfortable with a compact, efficient home.",
    neighbourhood: "This is the more connected face of Ari: close to the station, main road, shopping, offices, and the smaller streets that give the area its personality.",
    nearby: [
      { name: "BTS Ari", note: "Approximately 90 metres from the project, based on developer information." },
      { name: "La Villa Ari", note: "Dining, groceries, and services next to the station." },
      { name: "Vanit Place Aree", note: "A nearby cluster of food, coffee, and neighbourhood services." },
    ],
  },
  "thru-thonglor-1br": {
    title: "More room for Thonglor life, with space to come home to.",
    opening: "At 37 sq m, this one-bedroom offers more breathing room than many newer compact units. Its 16th-floor position and practical separation of living and sleeping areas make it a home for someone who enjoys Thonglor but still wants evenings to feel settled.",
    highlights: [
      "The larger one-bedroom footprint leaves room for both daily living and guests.",
      "A 16th-floor setting adds height and a greater sense of privacy.",
      "The address connects easily to the dining and lifestyle corridor of Thonglor.",
    ],
    idealFor: "A solo renter or couple who wants access to Thonglor's restaurants and social life, but values more usable interior space than a station-front micro unit.",
    neighbourhood: "This part of Thonglor is shaped by restaurants, cafés, community malls, and useful services. BTS Thong Lo is reachable, although the estimated walk should be tested in person.",
    nearby: [
      { name: "J Avenue Thonglor", note: "A well-known neighbourhood stop for dining, groceries, and everyday errands." },
      { name: "Camillian Hospital", note: "A hospital located on Sukhumvit 55 in the Thonglor area." },
      { name: "BTS Thong Lo", note: "The nearest BTS connection; the current listing estimates an 18-minute walk." },
    ],
  },
  "supalai-icon-sathorn-1br": {
    title: "A composed home for a life centred on Sathorn.",
    opening: "This 46 sq m residence gives a one-bedroom home the scale to feel calm after a full day in Bangkok's business district. The high-floor setting and modern building suit a more polished city routine without sacrificing practical living space.",
    highlights: [
      "A 46 sq m plan allows the living room and bedroom to feel properly distinct.",
      "The high-floor position supports a quieter, more private atmosphere.",
      "Sathorn, Silom, Lumphini, and multiple transport options remain within reach.",
    ],
    idealFor: "A professional or couple working around Sathorn or Silom who wants a refined home base, useful space, and access to both the business district and Lumphini's greener side.",
    neighbourhood: "Sathorn moves between office towers, restaurants, embassies, and quieter residential streets. The project sits close enough to the district's daily infrastructure without reducing the home to a place used only for sleep.",
    nearby: [
      { name: "MRT Lumphini", note: "Listed by the developer at approximately 800 metres from the project." },
      { name: "Lumphini Park", note: "Listed by the developer at approximately 850 metres." },
      { name: "Silom Complex", note: "Shopping, dining, and services listed at approximately 900 metres." },
    ],
  },
  "supalai-veranda-rama9-1br": {
    title: "High-floor space for a quieter side of Rama 9.",
    opening: "This 42 sq m home on the 28th floor gives one-bedroom living a generous, practical shape. It suits someone who wants the connectivity of Rama 9 but is willing to trade a doorstep MRT location for more room and a higher outlook.",
    highlights: [
      "The 42 sq m footprint offers comfortable space for everyday routines.",
      "A 28th-floor position brings height and separation from street level.",
      "The asking rent keeps the home positioned as a space-conscious Rama 9 option.",
    ],
    idealFor: "A solo renter or couple who values interior space and a high-floor setting, uses Rama 9 regularly, and is comfortable checking the station journey rather than living directly beside it.",
    neighbourhood: "Rama 9 combines offices, shopping, entertainment, and major road connections. The project sits on Rama 9 Road with access to the wider district rather than directly at the MRT junction.",
    nearby: [
      { name: "Central Rama 9", note: "A major shopping and services hub in the wider Rama 9 district." },
      { name: "MRT Phra Ram 9", note: "The nearest MRT connection; the current listing estimates a 14-minute walk." },
      { name: "Rama 9 business district", note: "Offices and daily services spread across the Rama 9 and Ratchadaphisek corridor." },
    ],
  },
  "belle-grand-rama9-1br": {
    title: "A practical city home in the middle of Rama 9's momentum.",
    opening: "Belle Grand Rama 9 puts a 42 sq m one-bedroom inside one of Bangkok's most self-contained business and shopping districts. The 22nd-floor home works well for someone who wants errands, offices, dining, and the MRT to fit naturally into the week.",
    highlights: [
      "The 42 sq m layout provides comfortable one-bedroom space for daily life.",
      "A 22nd-floor position adds a higher city perspective.",
      "Shopping, offices, restaurants, and MRT access are concentrated around the project.",
    ],
    idealFor: "A professional or couple working around Rama 9, Asoke, or Ratchadaphisek who wants convenience close to home and enough space for evenings in.",
    neighbourhood: "Rama 9 is energetic and highly practical: large offices, shopping centres, food, services, and transit sit close together, making it possible to handle much of daily life without crossing the city.",
    nearby: [
      { name: "The Shoppes at Belle", note: "Restaurants and everyday services within the Grand Rama 9 development." },
      { name: "Central Rama 9", note: "Shopping, dining, groceries, and services near the project." },
      { name: "Fortune Town", note: "IT retail, food, and services by MRT Phra Ram 9." },
    ],
  },
};

export function getListingStory(slug: string): ListingStory | null {
  return stories[slug] ?? null;
}
