import { PlaceDetailPage, placeMetadata } from "../../components/DiscoveryPages";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return placeMetadata("university", (await params).slug); }
export default async function Page({ params }: Props) { return <PlaceDetailPage kind="university" slug={(await params).slug} />; }
