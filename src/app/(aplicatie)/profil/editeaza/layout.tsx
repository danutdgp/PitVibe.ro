import { AreaSettings } from "@/components/area-settings";

export default function EditProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AreaSettings /></>;
}
