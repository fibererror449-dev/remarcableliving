import { permanentRedirect } from "next/navigation";

// The approach page became /about. Keep the old address working for shared links.
export default function ApproachPage() {
  permanentRedirect("/about");
}
