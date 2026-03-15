import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChefHat, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecipes, useRecipeAvailability } from '../hooks/useRecipes';
import { useTags } from '../hooks/useTags';
import type { Recipe, RecipeFilters } from '../lib/types';
import RecipeCard from '../components/recipes/RecipeCard';
import SearchBar from '../components/search/SearchBar';
import FilterPanel from '../components/search/FilterPanel';
import PageTransition from '../components/ui/PageTransition';

const defaultFilters: RecipeFilters = {
  search: '',
  tag_ids: [],
  max_cook_time: null,
  sort: 'newest',
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  color: string;
  recipes: Recipe[];
}

function CategorySection({ title, color, recipes }: CategorySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-1 w-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h2 className="text-base font-bold text-warm-800">{title}</h2>
        <span className="text-xs text-warm-400 shrink-0">{recipes.length} מתכונים</span>
        <div className="flex-1 h-px bg-warm-100" />
      </div>
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {recipes.map((recipe) => (
          <motion.div key={recipe.id} variants={cardVariants}>
            <RecipeCard recipe={recipe} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<RecipeFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { recipes, loading, error } = useRecipes(filters);
  const { tags } = useTags();
  const availability = useRecipeAvailability();

  const activeFilterCount =
    filters.tag_ids.length +
    (filters.max_cook_time !== null ? 1 : 0) +
    (filters.sort !== 'newest' ? 1 : 0);

  const hasActiveSearch = filters.search || activeFilterCount > 0;

  // Group recipes by first tag for category sections (only when no active filter/search)
  const categories = useMemo(() => {
    if (hasActiveSearch || loading || recipes.length === 0) return null;

    const tagMap = new Map(tags.map((t) => [t.id, t]));
    const grouped = new Map<string, { name: string; color: string; recipes: Recipe[] }>();
    const untagged: Recipe[] = [];

    for (const recipe of recipes) {
      const firstTag = recipe.tags?.[0];
      if (!firstTag) {
        untagged.push(recipe);
      } else {
        const key = firstTag.id;
        if (!grouped.has(key)) {
          const tagData = tagMap.get(key) ?? firstTag;
          grouped.set(key, { name: tagData.name, color: tagData.color, recipes: [] });
        }
        grouped.get(key)!.recipes.push(recipe);
      }
    }

    const sections: { id: string; name: string; color: string; recipes: Recipe[] }[] = [];
    grouped.forEach((value, key) => sections.push({ id: key, ...value }));
    if (untagged.length > 0) {
      sections.push({ id: '__untagged', name: 'כללי', color: '#9ca3af', recipes: untagged });
    }

    return sections.length > 0 ? sections : null;
  }, [recipes, tags, hasActiveSearch, loading]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-warm-50">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-bl from-warm-950 via-warm-900 to-brand-950">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-orange-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-7">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center shadow-lg shadow-brand-900/30">
                  <ChefHat size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">ספר המתכונים</h1>
                  {!loading && (
                    <p className="text-brand-300 text-sm">
                      {recipes.length > 0 ? `${recipes.length} מתכונים שמורים` : 'טרם נוספו מתכונים'}
                    </p>
                  )}
                </div>
              </motion.div>

              <Link
                to="/add"
                className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all shadow-lg"
              >
                <Plus size={18} />
                מתכון חדש
              </Link>
            </div>

            {/* Search + mobile filter toggle */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1">
                <SearchBar
                  value={filters.search}
                  onChange={(search) => setFilters((f) => ({ ...f, search }))}
                  variant="glass"
                />
              </div>
              {/* Mobile: show filter toggle button */}
              <button
                onClick={() => setShowMobileFilters((v) => !v)}
                className={`lg:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  showMobileFilters || activeFilterCount > 0
                    ? 'bg-white text-brand-700 border-white shadow'
                    : 'bg-white/15 backdrop-blur-sm text-white border-white/30 hover:bg-white/25'
                }`}
                aria-label="פתח סינון"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                סינון
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </header>

        {/* Page body: sidebar (visual right in RTL) + content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 lg:items-start">

            {/* Sidebar — first in DOM = visual RIGHT in RTL direction */}
            <aside>
              {/* Mobile: animated collapsible */}
              <AnimatePresence>
                {showMobileFilters && (
                  <motion.div
                    key="mobile-filters"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="mb-6 lg:hidden"
                  >
                    <FilterPanel filters={filters} onChange={setFilters} tags={tags} availability={availability} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop: always visible, sticky */}
              <div className="hidden lg:block lg:sticky lg:top-6">
                <FilterPanel filters={filters} onChange={setFilters} tags={tags} availability={availability} />
              </div>
            </aside>

            {/* Main recipe area */}
            <main className="min-w-0 space-y-8">
              {/* Search result count + clear */}
              {!loading && hasActiveSearch && recipes.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-warm-500">
                  <span>{recipes.length} תוצאות</span>
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-700 transition-colors"
                  >
                    <X size={12} /> נקה
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-sm">
                  שגיאה בטעינת המתכונים: {error}
                </div>
              )}

              {/* Loading skeletons */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <RecipeCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && recipes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-100 to-orange-100 mb-6 shadow-inner">
                    <ChefHat size={44} className="text-brand-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-warm-800 mb-3">
                    {hasActiveSearch ? 'לא נמצאו תוצאות' : 'המטבח מחכה לך'}
                  </h2>
                  <p className="text-warm-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                    {hasActiveSearch
                      ? 'נסה מילות חיפוש אחרות או שנה את הסינון'
                      : 'הוסף את המתכון הראשון שלך וצור ספר בישול אישי'}
                  </p>
                  {!hasActiveSearch && (
                    <Link
                      to="/add"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-l from-brand-600 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Plus size={18} />
                      הוסף מתכון ראשון
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Category sections — shown when no active search/filter */}
              {!loading && !error && categories && (
                <div className="space-y-10">
                  {categories.map((cat) => (
                    <CategorySection
                      key={cat.id}
                      title={cat.name}
                      color={cat.color}
                      recipes={cat.recipes}
                    />
                  ))}
                </div>
              )}

              {/* Flat grid — shown when searching or filtering */}
              {!loading && !error && !categories && recipes.length > 0 && (
                <motion.div
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {recipes.map((recipe) => (
                    <motion.div key={recipe.id} variants={cardVariants}>
                      <RecipeCard recipe={recipe} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </main>
          </div>
        </div>

        {/* Mobile FAB — right side (RTL start) */}
        <Link
          to="/add"
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-orange-500 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 animate-fab-pulse"
          aria-label="הוסף מתכון חדש"
        >
          <Plus size={24} />
        </Link>
      </div>
    </PageTransition>
  );
}
