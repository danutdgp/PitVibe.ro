import { InfoPage } from "@/components/info-page";
import { PrivacyPreferences } from "@/components/privacy-preferences";

export const metadata = { title: "Preferințe cookie-uri" };
export default function PreferencesPage() { return <InfoPage eyebrow="Controlul datelor" title="Cookie-uri și reclame" intro="Poți controla pe acest dispozitiv opțiunile care nu sunt strict necesare."><PrivacyPreferences /><p>Preferința locală nu activează reclame. Înainte de AdSense va fi integrată o platformă de consimțământ certificată și această pagină va fi actualizată.</p></InfoPage>; }
