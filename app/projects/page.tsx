import { directoryMetadata, PlaceDirectoryPage } from "../components/DiscoveryPages";
export const dynamic = "force-dynamic";
export const metadata = directoryMetadata("project");
export default function Page() { return <PlaceDirectoryPage kind="project" />; }
