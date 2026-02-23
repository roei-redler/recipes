import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'default' | 'glass';
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'חיפוש מתכון...',
  variant = 'default',
}: SearchBarProps) {
  const isGlass = variant === 'glass';

  return (
    <div className="relative">
      <Search
        size={18}
        className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          isGlass ? 'text-white/60' : 'text-warm-400'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pr-10 pl-9 py-2.5 rounded-xl text-sm transition-all outline-none ${
          isGlass
            ? 'bg-white/15 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/55 focus:bg-white/25 focus:border-white/50 focus:ring-2 focus:ring-white/20'
            : 'bg-white border border-warm-200 text-warm-900 placeholder:text-warm-400 focus:ring-2 focus:ring-brand-200 focus:border-brand-400'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            isGlass ? 'text-white/60 hover:text-white' : 'text-warm-400 hover:text-warm-700'
          }`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
