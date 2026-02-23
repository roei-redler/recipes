import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, ArrowRight, Loader2, Tag as TagIcon, UtensilsCrossed, ListOrdered, Image as ImageIcon } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { saveRecipe, useRecipe } from '../hooks/useRecipes';
import { useTags } from '../hooks/useTags';
import { useToast } from '../components/ui/Toast';
import type { RecipeFormData, IngredientFormData, StepFormData } from '../lib/types';
import IngredientRow from '../components/recipes/IngredientRow';
import StepForm from '../components/recipes/StepForm';
import ImageUpload from '../components/ui/ImageUpload';
import TagBadge from '../components/ui/TagBadge';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/ui/PageTransition';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#22c55e', '#f97316', '#14b8a6',
];

const emptyFormData = (): RecipeFormData => ({
  title: '',
  description: '',
  servings: '',
  prep_time: '',
  cook_time: '',
  image_url: null,
  ingredients: [],
  steps: [],
  tag_ids: [],
});

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}

function SectionCard({ title, icon, accentColor, children }: SectionCardProps) {
  return (
    <section className={`bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden border-r-4 ${accentColor}`}>
      <div className="px-6 py-4 border-b border-warm-100 bg-warm-50/50 flex items-center gap-2">
        <div className="text-warm-500">{icon}</div>
        <h2 className="font-bold text-warm-800 text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

export default function AddEditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { recipe, loading: recipeLoading } = useRecipe(id);
  const { tags, createTag } = useTags();
  const { showToast } = useToast();

  const [form, setForm] = useState<RecipeFormData>(emptyFormData());
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [creatingTag, setCreatingTag] = useState(false);

  const [ingredientsParent] = useAutoAnimate<HTMLDivElement>();
  const [stepsParent] = useAutoAnimate<HTMLDivElement>();
  const titleRef = useRef<HTMLInputElement>(null);

  // Populate form on edit
  useEffect(() => {
    if (isEdit && recipe) {
      setForm({
        title: recipe.title,
        description: recipe.description ?? '',
        servings: recipe.servings ?? '',
        prep_time: recipe.prep_time ?? '',
        cook_time: recipe.cook_time ?? '',
        image_url: recipe.image_url,
        ingredients: (recipe.ingredients ?? []).map((ing) => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity ?? '',
          unit: ing.unit,
          order_index: ing.order_index,
        })),
        steps: (recipe.steps ?? []).map((step) => ({
          id: step.id,
          description: step.description,
          image_url: step.image_url,
          order_index: step.order_index,
          duration: step.duration ?? '',
          imageFile: null,
        })),
        tag_ids: (recipe.tags ?? []).map((t) => t.id),
      });
      setCoverPreview(recipe.image_url);
    }
  }, [isEdit, recipe]);

  // Ingredients
  const addIngredient = () => {
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { name: '', quantity: '', unit: '', order_index: f.ingredients.length }],
    }));
  };

  const updateIngredient = (index: number, field: keyof IngredientFormData, value: string | number) => {
    setForm((f) => {
      const next = [...f.ingredients];
      next[index] = { ...next[index], [field]: value };
      return { ...f, ingredients: next };
    });
  };

  const removeIngredient = (index: number) => {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== index) }));
  };

  // Steps
  const addStep = () => {
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { description: '', image_url: null, order_index: f.steps.length, duration: '', imageFile: null }],
    }));
  };

  const updateStep = (index: number, field: keyof StepFormData, value: string | number | File | null) => {
    setForm((f) => {
      const next = [...f.steps];
      next[index] = { ...next[index], [field]: value };
      return { ...f, steps: next };
    });
  };

  const removeStep = (index: number) => {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }));
  };

  // Tags
  const toggleTag = (tagId: string) => {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId) ? f.tag_ids.filter((i) => i !== tagId) : [...f.tag_ids, tagId],
    }));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    const tag = await createTag(newTagName.trim(), newTagColor);
    setCreatingTag(false);
    if (tag) {
      setForm((f) => ({ ...f, tag_ids: [...f.tag_ids, tag.id] }));
      setNewTagName('');
      setTagModalOpen(false);
    }
  };

  // Cover image
  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, image_url: null }));
  };

  const handleCoverRemove = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setForm((f) => ({ ...f, image_url: null }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveRecipe(form, coverFile, id);
      showToast(isEdit ? 'המתכון עודכן בהצלחה' : 'המתכון נוסף בהצלחה', 'success');
      navigate(`/recipe/${result.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בשמירה';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && recipeLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-2.5 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 bg-warm-50 focus:bg-white transition-colors';
  const labelCls = 'block text-xs font-bold text-warm-500 uppercase tracking-wider mb-1';

  return (
    <PageTransition>
      <div className="min-h-screen bg-warm-50">
        {/* Header */}
        <div className="bg-gradient-to-bl from-warm-900 to-warm-800 text-white px-4 py-6 mb-8">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{isEdit ? 'עריכת מתכון' : 'מתכון חדש'}</h1>
              <p className="text-warm-400 text-xs mt-0.5">{isEdit ? 'עדכן את הפרטים' : 'מלא את הפרטים ושמור'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pb-16 space-y-6">

          {/* Basic Info */}
          <SectionCard title="פרטים כלליים" icon={<UtensilsCrossed size={16} />} accentColor="border-r-brand-400">
            <div>
              <label className={labelCls}>שם המתכון *</label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                placeholder="לדוגמה: עוגת שוקולד פונדנט"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>תיאור</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="תיאור קצר של המתכון..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>הכנה (דק')</label>
                <input type="number" value={form.prep_time} min={0}
                  onChange={(e) => setForm((f) => ({ ...f, prep_time: e.target.value ? Number(e.target.value) : '' }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>בישול (דק')</label>
                <input type="number" value={form.cook_time} min={0}
                  onChange={(e) => setForm((f) => ({ ...f, cook_time: e.target.value ? Number(e.target.value) : '' }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>מנות</label>
                <input type="number" value={form.servings} min={1}
                  onChange={(e) => setForm((f) => ({ ...f, servings: e.target.value ? Number(e.target.value) : '' }))}
                  className={inputCls}
                />
              </div>
            </div>
          </SectionCard>

          {/* Cover image */}
          <SectionCard title="תמונת שער" icon={<ImageIcon size={16} />} accentColor="border-r-orange-400">
            <ImageUpload currentUrl={coverPreview} onFileSelect={handleCoverSelect} onRemove={handleCoverRemove} label="תמונת שער" />
          </SectionCard>

          {/* Tags */}
          <SectionCard title="תגיות" icon={<TagIcon size={16} />} accentColor="border-r-purple-400">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} selected={form.tag_ids.includes(tag.id)} onClick={() => toggleTag(tag.id)} />
              ))}
              {tags.length === 0 && <p className="text-sm text-warm-400">אין תגיות עדיין</p>}
            </div>
            <button type="button" onClick={() => setTagModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-semibold transition-colors">
              <Plus size={14} /> תגית חדשה
            </button>
          </SectionCard>

          {/* Ingredients */}
          <SectionCard title="מצרכים" icon={<UtensilsCrossed size={16} />} accentColor="border-r-brand-500">
            <div ref={ingredientsParent} className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <IngredientRow key={`ing-${i}`} ingredient={ing} index={i} onChange={updateIngredient} onRemove={removeIngredient} />
              ))}
            </div>
            <button type="button" onClick={addIngredient}
              className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-semibold transition-colors">
              <Plus size={16} /> הוסף מצרך
            </button>
          </SectionCard>

          {/* Steps */}
          <SectionCard title="שלבי הכנה" icon={<ListOrdered size={16} />} accentColor="border-r-fresh-500">
            <div ref={stepsParent} className="space-y-3">
              {form.steps.map((step, i) => (
                <StepForm key={`step-${i}`} step={step} index={i} onChange={updateStep} onRemove={removeStep} />
              ))}
            </div>
            <button type="button" onClick={addStep}
              className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-semibold transition-colors">
              <Plus size={16} /> הוסף שלב
            </button>
          </SectionCard>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {saveError}
            </div>
          )}

          <div className="flex gap-3 justify-end pb-4">
            <button type="button" onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-warm-200 text-warm-600 hover:bg-warm-100 text-sm font-semibold transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-brand-600 to-orange-500 text-white text-sm font-bold hover:from-brand-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEdit ? 'שמור שינויים' : 'צור מתכון'}
            </button>
          </div>
        </form>

        {/* New tag modal */}
        <Modal isOpen={tagModalOpen} onClose={() => setTagModalOpen(false)} title="תגית חדשה" size="sm">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>שם התגית</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="לדוגמה: קינוח"
                className="w-full px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 bg-warm-50 focus:bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>צבע</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newTagColor === color ? 'border-warm-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {newTagName && (
              <div>
                <p className="text-xs text-warm-400 mb-1">תצוגה מקדימה:</p>
                <TagBadge name={newTagName} color={newTagColor} />
              </div>
            )}
            <button onClick={handleCreateTag} disabled={!newTagName.trim() || creatingTag}
              className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {creatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              צור תגית
            </button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
