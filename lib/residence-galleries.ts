import { hasMedia } from "./media";

// Hand-curated galleries and walkthroughs committed under public/properties. Server-only: it
// reads the media manifest, so a file that was never committed is skipped instead of 404ing.
export const baanKlangSlug = "baan-klang-krung-siam-2br";
export const ashtonSlug = "ashton-asoke-3br-42f";
export const centricAriSlug = "centric-ari-station-1br";
const baanKlangHero = "/properties/baan-klang-krung-siam/gallery/ad-09-living-wide.jpg";
const ashtonHero = "/properties/ashton-asoke/786342964_2664258444007827_8397648305202113964_n.jpg";
const centricAriHero = "/properties/centric-ari-station/06-living-room-rug-edited.png";

const baanKlangGallery = [
  { src: "/properties/baan-klang-krung-siam/gallery/ad-01-kitchen-close.jpg", alt: "Fitted kitchen with wood cabinetry, oven, refrigerator, and washing machine", caption: "Kitchen · fitted appliances" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-02-kidsroom-door.jpg", alt: "Second bedroom viewed from the doorway with a bed, desk, shelving, and green wardrobe", caption: "Second bedroom · doorway view" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-03-living-tv.jpg", alt: "Living room with television, sofa, balcony windows, and the main bedroom doorway", caption: "Living room · balcony light" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-07-living-dining.jpg", alt: "Open living and dining room with four-seat table and wide balcony windows", caption: "Living & dining · open plan" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-12-bath-tub.jpg", alt: "Bathroom with bathtub, vessel basin, large mirror, and window", caption: "Bathroom · full bathtub" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-13-dining-kitchen-2.jpg", alt: "Dining area looking toward the fitted kitchen and condominium entrance", caption: "Dining · kitchen connection" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-09-living-wide.jpg", alt: "Wide living room view with sofa, dining table, and balcony glazing", caption: "Living room · wide view" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-04-kitchen-living-long.jpg", alt: "Long view from the fitted kitchen through the dining area to the living room", caption: "Kitchen · living beyond" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-14-kidsroom.jpg", alt: "Second bedroom with bed, green wardrobe, desk, and built-in shelving", caption: "Second bedroom · desk & shelving" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-08-bath-master.jpg", alt: "Bathroom with glass shower, toilet, vessel basin, and large mirror", caption: "Bathroom · glass shower" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-11-master-window.jpg", alt: "Main bedroom with a large corner window, bed, wardrobes, and vanity", caption: "Main bedroom · corner windows" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-06-master-vanity.jpg", alt: "Main bedroom showing the bed, vanity, wardrobe, and bathroom doorway", caption: "Main bedroom · storage & vanity" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-05-dining-kitchen.jpg", alt: "Dining table and fitted kitchen viewed toward the condominium entrance", caption: "Dining · kitchen & entry" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-10-master-ensuite.jpg", alt: "Main bedroom with bed, wardrobe, window curtains, and bathroom doorway", caption: "Main bedroom · ensuite connection" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-15-bath-kids.jpg", alt: "Second bathroom with glass shower, toilet, basin, and bedroom reflected in the mirror", caption: "Second bathroom · walk-in shower" },
];

const ashtonGallery = [
  { src: "/properties/ashton-asoke/785600009_2664258387341166_2773769161220953558_n.jpg", alt: "Living and dining room with curved glass windows and a high-floor Bangkok view", caption: "Living & dining · panoramic glass" },
  { src: "/properties/ashton-asoke/787651634_2664258280674510_1837080743964192759_n.jpg", alt: "Wide living room with leather sofa, television, dining table, and city panorama", caption: "Living room · city panorama" },
  { src: "/properties/ashton-asoke/787541111_2664258497341155_5814287453646011722_n.jpg", alt: "Curved corner windows beside the furnished living room", caption: "Signature curve · skyline view" },
  { src: "/properties/ashton-asoke/787341599_2664259000674438_9220233050709240374_n.jpg", alt: "Unblocked panoramic view across the Bangkok skyline from the 42nd floor", caption: "42nd floor · unblocked outlook" },
  { src: "/properties/ashton-asoke/785688657_2664258814007790_5252665104865592283_n.jpg", alt: "Decorated bedroom with upholstered bed, wardrobes, and window seat", caption: "Bedroom · fitted storage" },
  { src: "/properties/ashton-asoke/787409620_2664258900674448_9182342866815816242_n.jpg", alt: "Front view of decorated bedroom with mirrored wardrobes and built-in seating", caption: "Bedroom · tailored details" },
  { src: "/properties/ashton-asoke/789085141_2664258617341143_717262392746460507_n.jpg", alt: "Bedroom beside a glass-walled bathroom and bathtub", caption: "Bedroom · glass bathroom suite" },
  { src: "/properties/ashton-asoke/788151357_2664258684007803_2233080501050944012_n.jpg", alt: "Leather sofa beneath framed artwork in a fully decorated sitting area", caption: "Sitting room · curated décor" },
  { src: "/properties/ashton-asoke/789325550_2664258740674464_3287056049430656030_n.jpg", alt: "Warmly lit internal hallway with mirrored wall panels", caption: "Hallway · private bedroom wing" },
];

const centricAriGallery = [
  { src: "/properties/centric-ari-station/06-living-room-rug-edited.png", alt: "Open living and dining area with a grey sofa and textured rug", caption: "Living & dining · softly layered" },
  { src: "/properties/centric-ari-station/12-kitchen-fridge-small-wall-art-edited.png", alt: "Compact kitchen with dark cabinetry, refrigerator, sink, and microwave", caption: "Kitchen · streamlined storage" },
  { src: "/properties/centric-ari-station/10-tv-shelving-option-b-edited.png", alt: "Television console beneath a slim oak shelf beside tall windows", caption: "Media wall · pared-back detail" },
  { src: "/properties/centric-ari-station/01-bedroom-door-entrance-edited.png", alt: "Bright bedroom with an upholstered bed, sage accents, and tall windows", caption: "Bedroom · restful city outlook" },
  { src: "/properties/centric-ari-station/02-bedroom-curtain-edited.png", alt: "Upholstered bed beside layered curtains and a softly lit bedside table", caption: "Bedroom · softened daylight" },
  { src: "/properties/centric-ari-station/03-bedroom-lamp-edited.png", alt: "Bedroom with a warm bedside lamp, timber door, and neutral finishes", caption: "Bedroom · evening mood" },
  { src: "/properties/centric-ari-station/07-bedroom-view-bed-throw-edited.png", alt: "Bedroom with a mirrored wardrobe, vanity, and direct bathroom access", caption: "Bedroom · storage & bathroom" },
  { src: "/properties/centric-ari-station/04-bathroom-unchanged.jpeg", alt: "Compact tiled bathroom with a vanity, mirror, and toilet through the doorway", caption: "Bathroom · integrated vanity" },
  { src: "/properties/centric-ari-station/05-bathroom-unchanged.jpeg", alt: "Grey-tiled bathroom with a glass walk-in shower, toilet, and open shelving", caption: "Bathroom · walk-in shower" },
  { src: "/properties/centric-ari-station/08-entry-view-curtains-rug-edited.png", alt: "Apartment entry opening toward the living room and balcony doors", caption: "Arrival · living room beyond" },
  { src: "/properties/centric-ari-station/11-water-heater-edited.png", alt: "Glass-enclosed shower with a wall-mounted water heater and chrome fixtures", caption: "Shower · dedicated hot water" },
];

export type CuratedPhoto = { src: string; alt: string; caption: string };
const galleries: Record<string, CuratedPhoto[]> = { [baanKlangSlug]: baanKlangGallery, [ashtonSlug]: ashtonGallery, [centricAriSlug]: centricAriGallery };
const heroes: Record<string, string> = { [baanKlangSlug]: baanKlangHero, [ashtonSlug]: ashtonHero, [centricAriSlug]: centricAriHero };
const walkthroughs: Record<string, string> = { [baanKlangSlug]: "/properties/baan-klang-krung-siam-walkthrough-v2.mp4", [centricAriSlug]: "/properties/centric-ari-station/cinematic-walkthrough.mp4" };

export function curatedResidence(slug: string) {
  const planned = galleries[slug] ?? [];
  const video = walkthroughs[slug];
  return {
    planned: planned.length,
    gallery: planned.filter((photo) => hasMedia(photo.src)),
    hero: heroes[slug] && hasMedia(heroes[slug]) ? heroes[slug] : null,
    video: video && hasMedia(video) ? video : null,
  };
}
