import Link from "next/link";
import Image from "next/image";
import { CategoryIcon } from "@/components/shop/category-icon";

/** Broşür stili kategori kartı: gerçek foto + lacivert etiket bandı. */
export function CategoryTile({
  name,
  slug,
  icon,
  imageUrl,
}: {
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={`/kategori/${slug}`}
      className="group overflow-hidden rounded-xl border border-line bg-paper shadow-sm transition hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-md"
    >
      <div className="relative aspect-square bg-mist">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width:768px) 33vw, 14vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-navy/40">
            <CategoryIcon name={icon} className="h-10 w-10" />
          </span>
        )}
      </div>
      <div className="bg-navy px-2 py-2 text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-paper group-hover:text-orange-light">
          {name}
        </span>
      </div>
    </Link>
  );
}
