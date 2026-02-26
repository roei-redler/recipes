import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';

interface ImageUploadProps {
  currentUrl?: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  label?: string;
}

// Accept all image formats including HEIC/HEIF from iOS
const ACCEPT = 'image/*,.heic,.heif';

export default function ImageUpload({ currentUrl, onFileSelect, onRemove, label = 'תמונה' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
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

        {/* Hidden input for replacing the image */}
        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors pointer-events-none" />

        {/* Replace button — center of image */}
        <button
          type="button"
          onClick={() => replaceInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="החלף תמונה"
        >
          <div className="flex items-center gap-2 bg-white/90 text-warm-800 text-sm font-semibold px-4 py-2 rounded-full shadow">
            <Camera size={15} /> החלף תמונה
          </div>
        </button>

        {/* Remove button — top corner (stop propagation so it doesn't trigger replace) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="הסר תמונה"
        >
          <X size={14} />
        </button>
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
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
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
        <p className="text-xs text-warm-400 mt-1">כל סוגי התמונות נתמכים</p>
      </div>
    </div>
  );
}
