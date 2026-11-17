import { SPACE_ICONS } from '@/lib/spaceIcons';

interface Props {
  name: string;
  icon?: string | null;
  color: string;
  /** edge length in px */
  size?: number;
  className?: string;
}

/** A space's badge: its chosen icon, or the first letter of its name. */
export default function SpaceIcon({ name, icon, color, size = 16, className = '' }: Props) {
  const Icon = icon ? SPACE_ICONS[icon] : undefined;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded font-bold text-white ${className}`}
      style={{ backgroundColor: color, width: size, height: size, fontSize: Math.round(size * 0.62) }}
      aria-hidden
    >
      {Icon ? <Icon style={{ width: size * 0.65, height: size * 0.65 }} strokeWidth={2.25} /> : name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
