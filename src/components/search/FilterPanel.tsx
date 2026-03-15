import { SlidersHorizontal, X } from 'lucide-react';
import type { RecipeFilters, Tag } from '../../lib/types';
import type { RecipeAvailability } from '../../hooks/useRecipes';
import TagBadge from '../ui/TagBadge';

interface FilterPanelProps {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
  tags: Tag[];
  availability: RecipeAvailability;
}

const TIME_OPTIONS = [
  { label: 'הכל', value: null },
  { label: "עד 15 דק'", value: 15 },
  { label: "עד 30 דק'", value: 30 },
  { label: "עד 60 דק'", value: 60 },
];

const SORT_OPTIONS: { label: string; value: RecipeFilters['sort'] }[] = [
  { label: 'הכי חדש', value: 'newest' },
  { label: 'הכי ישן', value: 'oldest' },
  { label: 'א-ב', value: 'alpha' },
];

export default function FilterPanel({ filters, onChange, tags, availability }: FilterPanelProps) {
  const usedTagSet = new Set(availability.usedTagIds);

  const isTimeAvailable = (maxTime: number) =>
    availability.cookTimes.some((t) => t <= maxTime);

  const toggleTag = (tagId: string) => {
    const next = filters.tag_ids.includes(tagId)
      ? filters.tag_ids.filter((id) => id !== tagId)
      : [...filters.tag_ids, tagId];
    onChange({ ...filters, tag_ids: next });
  };

  const activeFilters =
    filters.tag_ids.length > 0 ||
    filters.max_cook_time !== null ||
    filters.search !== '' ||
    filters.sort !== 'newest';

  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-150';
  const pillActive = 'bg-brand-500 text-white border-brand-500 shadow-sm cursor-pointer';
  const pillInactive = 'bg-warm-50 text-warm-600 border-warm-200 hover:border-brand-300 hover:text-brand-600 cursor-pointer';
  const pillDisabled = 'bg-warm-50 text-warm-300 border-warm-100 cursor-default';

  return (
    <div className="bg-white border border-warm-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-warm-800">
        <SlidersHorizontal size={16} className="text-brand-500" />
        <span>סינון ומיון</span>
        {activeFilters && (
          <button
            onClick={() => onChange({ search: '', tag_ids: [], max_cook_time: null, sort: 'newest' })}
            className="me-auto flex items-center gap-1 text-xs text-warm-400 hover:text-warm-700 transition-colors"
          >
            <X size={12} />
            נקה הכל
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">מיון</p>
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, sort: opt.value })}
              className={`${pillBase} ${filters.sort === opt.value ? pillActive : pillInactive}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time filter */}
      <div>
        <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">זמן בישול</p>
        <div className="flex gap-2 flex-wrap">
          {TIME_OPTIONS.map((opt) => {
            const disabled = opt.value !== null && !isTimeAvailable(opt.value);
            return (
              <button
                key={opt.label}
                onClick={() => !disabled && onChange({ ...filters, max_cook_time: opt.value })}
                disabled={disabled}
                className={`${pillBase} ${
                  disabled
                    ? pillDisabled
                    : filters.max_cook_time === opt.value
                      ? pillActive
                      : pillInactive
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">תגיות</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const disabled = !usedTagSet.has(tag.id);
              return (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  size="sm"
                  selected={!disabled && filters.tag_ids.includes(tag.id)}
                  disabled={disabled}
                  onClick={disabled ? undefined : () => toggleTag(tag.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
