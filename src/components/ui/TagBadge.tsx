import { X } from 'lucide-react';

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
  overlay?: boolean; // true when rendered over a dark image
}

export default function TagBadge({
  name,
  color,
  onRemove,
  onClick,
  selected,
  size = 'md',
  overlay = false,
}: TagBadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (overlay) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} bg-white/20 backdrop-blur-sm text-white border border-white/30`}
      >
        {name}
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium cursor-pointer select-none transition-all ${padding} ${
        selected ? 'ring-2 ring-offset-1 scale-105' : 'opacity-80 hover:opacity-100'
      }`}
      style={{
        backgroundColor: color + '22',
        color,
        borderColor: color,
        outlineColor: selected ? color : undefined,
      }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="me-0 ms-1 hover:text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label={`הסר תגית ${name}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}
