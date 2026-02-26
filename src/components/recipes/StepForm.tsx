import { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Image as ImageIcon, X, Timer } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StepFormData } from '../../lib/types';

interface StepFormProps {
  id: number;
  step: StepFormData;
  index: number;
  onChange: (index: number, field: keyof StepFormData, value: string | number | File | null) => void;
  onRemove: (index: number) => void;
}

export default function StepForm({ id, step, index, onChange, onRemove }: StepFormProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [preview, setPreview] = useState<string | null>(step.image_url);
  const previewRef = useRef<string | null>(preview);
  useEffect(() => { previewRef.current = preview; }, [preview]);
  useEffect(() => {
    return () => { if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current); };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current);
    onChange(index, 'imageFile', file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current);
    onChange(index, 'imageFile', null);
    onChange(index, 'image_url', null);
    setPreview(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-3 group bg-white border rounded-2xl p-4 shadow-sm transition-colors ${
        isDragging ? 'border-brand-300 shadow-lg opacity-70 z-10 relative' : 'border-warm-100 hover:border-warm-200'
      }`}
    >
      <GripVertical
        size={16}
        className="text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing mt-1 shrink-0 touch-none"
        {...attributes}
        {...listeners}
      />

      {/* Step number badge */}
      <div className="flex items-start justify-center w-8 h-8 mt-0.5 rounded-xl bg-brand-100 text-brand-700 text-sm font-bold shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 space-y-3">
        <textarea
          value={step.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder={`תיאור שלב ${index + 1}...`}
          rows={3}
          className="w-full px-3 py-2 border border-warm-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 bg-warm-50 focus:bg-white transition-colors"
        />

        {/* Duration for cooking mode timer */}
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-warm-400 shrink-0" />
          <input
            type="number"
            value={step.duration}
            onChange={(e) => onChange(index, 'duration', e.target.value ? Number(e.target.value) : '')}
            placeholder="זמן (דק')"
            min={0}
            max={999}
            className="w-28 px-3 py-1.5 border border-warm-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 bg-warm-50 focus:bg-white transition-colors"
          />
          <span className="text-xs text-warm-400">דקות לשעון עצר</span>
        </div>

        {/* Step image */}
        {preview ? (
          <div className="relative w-32 h-24 rounded-xl overflow-hidden group/img">
            <img src={preview} alt={`שלב ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-1.5 text-xs text-warm-400 hover:text-brand-600 cursor-pointer transition-colors">
            <ImageIcon size={14} />
            <span>הוסף תמונה לשלב</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-warm-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-1"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
