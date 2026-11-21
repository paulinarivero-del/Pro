export type ThermomixModel = 'TM6' | 'TM7';

export type IngredientStatus = 'pending' | 'have' | 'missing';

export interface IngredientItem {
  id: string;
  text: string;
  note?: string;
  status: IngredientStatus;
}

export interface RecipeStep {
  id: string;
  order: number;
  text: string;
  thermomixParams?: string;
}

export interface Recipe {
  id: string;
  parentId?: string;
  clientName?: string;
  title: string;
  description: string;
  model: ThermomixModel;
  imageUrl: string;
  prepTime: string;
  servings: string;
  cookidooUrl?: string;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface CookidooExtractResponse {
  success: boolean;
  partial: boolean;
  blocked: boolean;
  message: string;
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    prepTime?: string;
    servings?: string;
    ingredients: Array<{ text: string; note?: string }>;
    steps: Array<{ text: string; thermomixParams?: string }>;
    cookidooUrl: string;
  };
}
