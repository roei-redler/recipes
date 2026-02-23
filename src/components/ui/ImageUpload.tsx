import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  currentUrl?: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  label?: string;
}

export default function ImageUpload({ currentUrl, onFileSelect, onRemove, label = 'תמונה' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (currentUrl) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border-2 border-warm-200">
        <img src={currentUrl} alt={label} className="w-full h-52 object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <X size={14} />
        </button>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-brand-400 bg-brand-50 scale-[1.01]'
          : 'border-warm-300 hover:border-brand-300 hover:bg-warm-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className={`p-4 rounded-2xl transition-colors ${dragging ? 'bg-brand-100' : 'bg-warm-100'}`}>
        {dragging
          ? <Upload className="text-brand-500 animate-bounce" size={28} />
          : <ImageIcon className="text-warm-400" size={28} />
        }
      </div>
      <div className="text-center">
        <p className="text-sm text-warm-500">
          גרור תמונה לכאן או{' '}
          <span className="text-brand-600 font-semibold">לחץ לבחור</span>
        </p>
        <p className="text-xs text-warm-400 mt-1">PNG, JPG, WEBP עד 10MB</p>
      </div>
    </div>
  );
}
