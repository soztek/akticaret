import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignForm } from "../campaign-form";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <div>
      <Link href="/admin/kampanyalar" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
        <ArrowLeft className="h-4 w-4" /> Kampanyalara dön
      </Link>
      <h1 className="text-2xl font-bold text-ink">Yeni Kampanya</h1>
      <CampaignForm />
    </div>
  );
}
