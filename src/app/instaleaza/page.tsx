import { InfoPage } from "@/components/info-page";
import { InstallGuide } from "@/components/install-guide";

export const metadata = { title: "Instalează aplicația" };
export default function InstallPage() { return <InfoPage eyebrow="PWA" title="Instalează PitVibe.ro" intro="Folosește comunitatea din Pitești ca pe o aplicație, direct de pe ecranul telefonului."><InstallGuide /></InfoPage>; }
