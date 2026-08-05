import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      <Link href="/" className="hover:text-orange">Ana Sayfa</Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-faint" />
          {item.href ? (
            <Link href={item.href} className="hover:text-orange">{item.label}</Link>
          ) : (
            <span className="font-medium text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
