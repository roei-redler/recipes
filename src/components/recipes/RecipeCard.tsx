import { Clock, Users, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Recipe } from '../../lib/types';
import TagBadge from '../ui/TagBadge';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link
        to={`/recipe/${recipe.id}`}
        className="group relative block h-72 rounded-2xl overflow-hidden shadow-md"
      >
        {/* Image or gradient fallback */}
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-200 via-amber-200 to-orange-300">
            <div className="flex items-center justify-center h-full group-hover:scale-105 transition-transform duration-500 ease-out">
              <ChefHat size={56} className="text-brand-600/40" />
            </div>
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Time badge — top start (RTL: visual right) */}
        {totalTime > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            <Clock size={11} />
            <span>{totalTime} דק'</span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {recipe.tags.slice(0, 2).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" overlay />
              ))}
              {recipe.tags.length > 2 && (
                <span className="text-xs text-white/70 self-center">+{recipe.tags.length - 2}</span>
              )}
            </div>
          )}

          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-brand-200 transition-colors duration-200">
            {recipe.title}
          </h3>

          {recipe.servings && (
            <p className="text-white/65 text-xs mt-1 flex items-center gap-1">
              <Users size={11} />
              {recipe.servings} מנות
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
