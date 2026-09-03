import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { CategoryIcon } from "@/components/shop/category-icon";

/** Broşür stili kategori kartı: gerçek foto + lacivert etiket bandı.
 *  compact: daha küçük (tek satır şerit için). */
export function CategoryTile({
  name,
  slug,
  icon,
  imageUrl,
  compact = false,
  className,
}: {
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/kategori/${slug}`}
      className={clsx(
        "group overflow-hidden rounded-xl border border-line bg-paper shadow-sm transition hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-md",
        className,
      )}
    >
      <div className={clsx("relative bg-mist", compact ? "h-20" : "aspect-square")}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes={compact ? "140px" : "(max-width:768px) 33vw, 14vw"}
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-navy/40">
            <CategoryIcon name={icon} className={compact ? "h-7 w-7" : "h-10 w-10"} />
          </span>
        )}
      </div>
      <div className={clsx("bg-navy text-center", compact ? "px-1.5 py-1.5" : "px-2 py-2")}>
        <span
          className={clsx(
            "font-bold uppercase tracking-wide text-paper group-hover:text-orange-light",
            compact ? "line-clamp-2 text-[10px] leading-tight" : "text-xs",
          )}
        >
          {name}
        </span>
      </div>
    </Link>
  );
}
