export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string;
  order_index: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  description: string;
  image_url: string | null;
  order_index: number;
  duration: number | null; // minutes for the cooking mode timer
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  image_url: string | null;
  lock_password: string | null; // SHA-256 hex hash; null = unlocked
  created_at: string;
  updated_at: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  tags?: Tag[];
}

export interface RecipeFormData {
  title: string;
  description: string;
  servings: number | '';
  prep_time: number | '';
  cook_time: number | '';
  image_url: string | null;
  lock_password: string | null;      // current hash stored in DB (null = not locked)
  newLockPassword: string;           // plain-text entered in form; '' = no change / remove
  removeLock: boolean;               // explicit flag to remove existing lock
  ingredients: IngredientFormData[];
  steps: StepFormData[];
  tag_ids: string[];
}

export interface IngredientFormData {
  id?: string;
  name: string;
  quantity: number | '';
  unit: string;
  order_index: number;
}

export interface StepFormData {
  id?: string;
  description: string;
  image_url: string | null;
  order_index: number;
  duration: number | ''; // minutes
  imageFile?: File | null;
}

export interface RecipeFilters {
  search: string;
  tag_ids: string[];
  max_cook_time: number | null;
  sort: 'newest' | 'oldest' | 'alpha';
}
