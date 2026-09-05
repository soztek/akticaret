import {
  Building2,
  Wrench,
  Hammer,
  Drill,
  HardHat,
  Droplets,
  Paintbrush,
  PaintRoller,
  Layers,
  Blocks,
  FlaskConical,
  Boxes,
  Package,
  Grip,
  Mountain,
  Grid2x2,
  Zap,
  Ruler,
  Sprout,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Building2,
  Wrench,
  Hammer,
  Drill,
  HardHat,
  Droplets,
  Paintbrush,
  PaintRoller,
  Layers,
  Blocks,
  FlaskConical,
  Boxes,
  Package,
  Grip,
  Mountain,
  Grid2x2,
  Zap,
  Ruler,
  Sprout,
};

/** Seçilebilir ikon adları (admin kategori formu için). */
export const ICON_NAMES = Object.keys(MAP);

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && MAP[name]) || Package;
  return <Icon className={className} />;
}
