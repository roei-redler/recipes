import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock,
  Users,
  Edit2,
  Trash2,
  Loader2,
  ChefHat,
  CheckCircle2,
  Circle,
  Play,
  Timer,
  Share2,
  Copy,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecipe, deleteRecipe } from '../hooks/useRecipes';
import { useToast } from '../components/ui/Toast';
import TagBadge from '../components/ui/TagBadge';
import Modal from '../components/ui/Modal';
import CookingMode from '../components/recipes/CookingMode';
import PageTransition from '../components/ui/PageTransition';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { recipe, loading, error } = useRecipe(id);
  const { showToast } = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [cookingMode, setCookingMode] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      // Sync home list immediately — no manual refresh needed
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      showToast('המתכון נמחק', 'info');
      navigate('/');
    } catch {
      showToast('שגיאה במחיקת המתכון', 'error');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;

    // Build a nice plain-text copy of the recipe
    const lines: string[] = [`🍳 ${recipe.title}`];
    if (recipe.description) lines.push('', recipe.description);
    if (recipe.prep_time || recipe.cook_time) {
      const parts = [];
      if (recipe.prep_time) parts.push(`הכנה: ${recipe.prep_time} דק'`);
      if (recipe.cook_time) parts.push(`בישול: ${recipe.cook_time} דק'`);
      lines.push('', '⏱ ' + parts.join(' | '));
    }
    if (recipe.ingredients?.length) {
      lines.push('', '📋 מצרכים:');
      recipe.ingredients.forEach((ing) => {
        const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
        lines.push(`• ${ing.name}${qty ? ` — ${qty}` : ''}`);
      });
    }
    if (recipe.steps?.length) {
      lines.push('', '👨‍🍳 שלבי הכנה:');
      recipe.steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${step.description}`);
      });
    }
    const text = lines.join('\n');
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, text, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('המתכון הועתק ללוח — אפשר להדביק בכל מקום', 'success');
    } catch {
      showToast('לא ניתן להעתיק', 'error');
    }
  };

  const toggleStep = (i: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleIngredient = (i: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Skeleton className="h-80 w-full" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 mb-4">{error ?? 'המתכון לא נמצא'}</p>
        <Link to="/" className="text-brand-600 hover:underline">חזור לדף הבית</Link>
      </div>
    );
  }

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);
  const stepsCount = recipe.steps?.length ?? 0;
  const progress = stepsCount > 0 ? (checkedSteps.size / stepsCount) * 100 : 0;
  const hasTimers = recipe.steps?.some((s) => s.duration && s.duration > 0);

  if (cookingMode) {
    return <CookingMode recipe={recipe} onExit={() => setCookingMode(false)} />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-warm-50">
        {/* ── Hero ── */}
        <div className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-brand-200 to-orange-300">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat size={80} className="text-brand-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Back + Home buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              title="חזור"
            >
              <ArrowRight size={20} />
            </button>
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              title="דף הבית"
            >
              <Home size={18} />
            </Link>
          </div>

          {/* Edit / Delete / Share */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/30 backdrop-blur-sm text-white border border-white/20 hover:bg-black/50 transition-colors"
              title="שתף מתכון"
            >
              <Share2 size={12} /> שיתוף
            </button>
            <Link
              to={`/edit/${recipe.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/30 backdrop-blur-sm text-white border border-white/20 hover:bg-black/50 transition-colors"
            >
              <Edit2 size={12} /> עריכה
            </Link>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/70 backdrop-blur-sm text-white border border-red-300/30 hover:bg-red-600/80 transition-colors"
            >
              <Trash2 size={12} /> מחיקה
            </button>
          </div>

          {/* Title block at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 animate-hero-in">
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {recipe.tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" overlay />
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-white/75 text-sm">
              {totalTime > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {totalTime} דקות
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {recipe.servings} מנות
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          {recipe.description && (
            <p className="text-warm-600 text-base leading-relaxed mb-8 max-w-2xl animate-fade-up">
              {recipe.description}
            </p>
          )}

          {/* Action buttons row */}
          {stepsCount > 0 && (
            <div className="flex flex-wrap gap-3 items-center mb-8">
              <button
                onClick={() => setCookingMode(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-l from-brand-600 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Play size={18} />
                התחל להכין
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-200 text-warm-700 text-sm font-semibold shadow-sm hover:shadow-md hover:border-warm-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Copy size={15} />
                העתק מתכון
              </button>
              {hasTimers && (
                <span className="flex items-center gap-1 text-xs text-warm-400">
                  <Timer size={13} /> שעוני עצר לכל שלב
                </span>
              )}
            </div>
          )}

          {/* Share button when no steps */}
          {stepsCount === 0 && (
            <div className="mb-8">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-200 text-warm-700 text-sm font-semibold shadow-sm hover:shadow-md hover:border-warm-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Copy size={15} />
                העתק מתכון
              </button>
            </div>
          )}

          {/* Progress bar */}
          {stepsCount > 0 && checkedSteps.size > 0 && (
            <div className="mb-8">
              <div className="flex justify-between text-xs text-warm-500 mb-1.5">
                <span>התקדמות</span>
                <span>{checkedSteps.size}/{stepsCount} שלבים</span>
              </div>
              <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-l from-fresh-500 to-fresh-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* ── Desktop two-column / Mobile tabs ── */}

          {/* Mobile tabs */}
          <div className="lg:hidden">
            <Tabs defaultValue="ingredients">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="ingredients" className="flex-1">
                  מצרכים {recipe.ingredients?.length ? `(${recipe.ingredients.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="steps" className="flex-1">
                  שלבי הכנה {stepsCount ? `(${stepsCount})` : ''}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ingredients">
                <IngredientsList
                  ingredients={recipe.ingredients}
                  checkedIngredients={checkedIngredients}
                  onToggle={toggleIngredient}
                  servings={recipe.servings}
                />
              </TabsContent>
              <TabsContent value="steps">
                <StepsList
                  steps={recipe.steps}
                  checkedSteps={checkedSteps}
                  onToggle={toggleStep}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop 2-column */}
          <div className="hidden lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
            <div className="sticky top-6">
              <IngredientsList
                ingredients={recipe.ingredients}
                checkedIngredients={checkedIngredients}
                onToggle={toggleIngredient}
                servings={recipe.servings}
              />
            </div>
            <StepsList
              steps={recipe.steps}
              checkedSteps={checkedSteps}
              onToggle={toggleStep}
            />
          </div>
        </div>

        {/* Delete modal */}
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="מחיקת מתכון" size="sm">
          <p className="text-warm-600 mb-6">
            האם למחוק את <strong>{recipe.title}</strong>? פעולה זו אינה ניתנת לביטול.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-600 hover:bg-warm-50 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              מחק
            </button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function IngredientsList({
  ingredients,
  checkedIngredients,
  onToggle,
  servings,
}: {
  ingredients?: { id: string; name: string; quantity: number | null; unit: string }[];
  checkedIngredients: Set<number>;
  onToggle: (i: number) => void;
  servings?: number | null;
}) {
  if (!ingredients?.length) return null;
  return (
    <section>
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-warm-100 bg-warm-50">
          <h2 className="text-lg font-bold text-warm-900">מצרכים</h2>
          {servings && <p className="text-xs text-warm-400 mt-0.5">{servings} מנות</p>}
        </div>
        {ingredients.map((ing, i) => (
          <button
            key={ing.id}
            onClick={() => onToggle(i)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-right transition-colors border-b border-warm-50 last:border-0 ${
              checkedIngredients.has(i) ? 'bg-fresh-50/50' : 'hover:bg-warm-50'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {checkedIngredients.has(i) ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 size={18} className="text-fresh-500 shrink-0" />
                </motion.div>
              ) : (
                <motion.div key="circle" initial={{ scale: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <Circle size={18} className="text-warm-300 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* In RTL Hebrew: quantity + unit appear first (inline-start side, after checkbox) */}
            {(ing.quantity || ing.unit) && (
              <span className={`text-sm font-semibold shrink-0 min-w-[3.5rem] ${checkedIngredients.has(i) ? 'text-warm-300' : 'text-brand-700'}`}>
                {ing.quantity} {ing.unit}
              </span>
            )}
            <span className={`flex-1 text-sm text-right ${checkedIngredients.has(i) ? 'line-through text-warm-400' : 'text-warm-700'}`}>
              {ing.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function StepsList({
  steps,
  checkedSteps,
  onToggle,
}: {
  steps?: { id: string; description: string; image_url: string | null; duration?: number | null }[];
  checkedSteps: Set<number>;
  onToggle: (i: number) => void;
}) {
  if (!steps?.length) return null;
  return (
    <section>
      <h2 className="text-xl font-bold text-warm-900 mb-4">שלבי הכנה</h2>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            layout
            onClick={() => onToggle(i)}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all ${
              checkedSteps.has(i)
                ? 'border-fresh-200 opacity-60'
                : 'border-warm-100 hover:shadow-md hover:border-warm-200'
            }`}
          >
            <div className="flex gap-4">
              <motion.div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 transition-colors ${
                  checkedSteps.has(i) ? 'bg-fresh-500 text-white' : 'bg-brand-100 text-brand-700'
                }`}
                animate={checkedSteps.has(i) ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                {checkedSteps.has(i) ? <CheckCircle2 size={20} /> : i + 1}
              </motion.div>
              <div className="flex-1">
                <p className={`leading-relaxed transition-colors ${checkedSteps.has(i) ? 'line-through text-warm-400' : 'text-warm-700'}`}>
                  {step.description}
                </p>
                {step.duration && step.duration > 0 && (
                  <p className="flex items-center gap-1 text-xs text-brand-500 mt-1.5 font-medium">
                    <Timer size={12} /> {step.duration} דקות
                  </p>
                )}
                {step.image_url && (
                  <img
                    src={step.image_url}
                    alt={`שלב ${i + 1}`}
                    className="mt-3 rounded-xl w-full max-h-48 object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
