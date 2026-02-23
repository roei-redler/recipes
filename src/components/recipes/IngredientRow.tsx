import { GripVertical, Trash2 } from 'lucide-react';
import type { IngredientFormData } from '../../lib/types';

interface IngredientRowProps {
  ingredient: IngredientFormData;
  index: number;
  onChange: (index: number, field: keyof IngredientFormData, value: string | number) => void;
  onRemove: (index: number) => void;
}

const COMMON_UNITS = ['', 'גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כוס', 'כף', 'כפית', 'יחידה', 'פרוסה', 'קורט'];

const inputCls = 'px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 bg-warm-50 focus:bg-white transition-colors';

export default function IngredientRow({ ingredient, index, onChange, onRemove }: IngredientRowProps) {
  return (
    <div className="group rounded-xl border border-warm-100 bg-white p-2 space-y-2 hover:border-warm-200 transition-colors">
      {/* Row 1: grip + name + delete */}
      <div className="flex items-center gap-2">
        <GripVertical size={16} className="text-warm-300 cursor-grab shrink-0" />
        <input
          type="text"
          value={ingredient.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="שם המצרך"
          className={`flex-1 ${inputCls}`}
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-2 text-warm-300 hover:text-red-500 transition-colors shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Row 2: quantity + unit */}
      <div className="flex items-center gap-2 ms-7 me-10">
        <input
          type="number"
          value={ingredient.quantity}
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          placeholder="כמות"
          min={0}
          step="any"
          className={`w-24 ${inputCls}`}
        />
        <select
          value={ingredient.unit}
          onChange={(e) => onChange(index, 'unit', e.target.value)}
          className={`flex-1 ${inputCls}`}
        >
          {COMMON_UNITS.map((u) => (
            <option key={u} value={u}>{u || '—'}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
