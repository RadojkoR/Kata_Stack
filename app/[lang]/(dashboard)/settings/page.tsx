import type { Metadata } from "next";
import { SettingsPanel } from "@/components/SettingsPanel";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.settings.title} · ${dict.meta.title}` };
}

export default async function SettingsPage() {
  const dict = await getDictionary();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{dict.settings.title}</h1>
      <SettingsPanel labels={dict.settings} />
    </main>
  );
}
