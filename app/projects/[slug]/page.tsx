import { PlaceDetailPage, placeMetadata } from "../../components/DiscoveryPages";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return placeMetadata("project", (await params).slug); }
export default async function Page({ params }: Props) { return <PlaceDetailPage kind="project" slug={(await params).slug} />; }
