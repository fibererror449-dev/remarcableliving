import { PlaceDetailPage, placeMetadata } from "../../components/DiscoveryPages";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return placeMetadata("area", (await params).slug); }
export default async function Page({ params }: Props) { return <PlaceDetailPage kind="area" slug={(await params).slug} />; }
