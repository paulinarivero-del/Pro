import { IngredientItem, Recipe, RecipeStep } from '../types/recipe';

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Parses a pasted multi-line ingredient list into structured editable rows.
 * Automatically strips bullets, checkboxes, and extracts parenthetical notes such as "(opcional)".
 */
export function parseBulkIngredients(rawText: string): IngredientItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items: IngredientItem[] = [];

  for (const rawLine of lines) {
    // Strip common bullet points, dashes, checkboxes, or leading numbers
    let cleaned = rawLine
      .replace(/^[\u2022\u25E6\u25AA\-\*\·\✅\❌\☐\☑]+\s*/, '')
      .replace(/^(\[\s*[xX ]?\s*\])\s*/, '')
      .trim();

    if (!cleaned) continue;

    // Skip section headers if someone copied "Ingredientes:"
    if (/^ingredientes\s*:?$/i.test(cleaned)) continue;

    let note: string | undefined;
    // Detect trailing parenthetical notes e.g. "(opcional)" or "(ajustar a gusto)"
    const parenMatch = cleaned.match(/\(([^)]{2,45})\)\s*$/);
    if (parenMatch) {
      const candidate = parenMatch[1].trim();
      if (/opcional|gusto|decorar|servir|fresco|picad|rallad|aprox|sustitui/i.test(candidate)) {
        note = candidate;
        cleaned = cleaned.slice(0, parenMatch.index).trim();
      }
    } else {
      // Also detect ", opcional" or " - opcional" at the end
      const commaNote = cleaned.match(/[,\-]\s*(opcional|a gusto|ajustar a gusto|al gusto|para decorar)\s*$/i);
      if (commaNote) {
        note = commaNote[1].trim();
        cleaned = cleaned.slice(0, commaNote.index).trim();
      }
    }

    items.push({
      id: createId('ing'),
      text: cleaned,
      note,
      status: 'pending',
    });
  }

  return items;
}

/**
 * Parses a pasted multi-line block of preparation steps into numbered RecipeStep items.
 */
export function parseBulkSteps(rawText: string): RecipeStep[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const steps: RecipeStep[] = [];

  for (const rawLine of lines) {
    if (/^(preparación|pasos|elaboración)\s*:?$/i.test(rawLine)) continue;

    const cleaned = rawLine
      .replace(/^(paso\s*)?\d{1,2}[\.\)\:\-]\s*/i, '')
      .replace(/^[\u2022\-\*]+\s*/, '')
      .trim();

    if (!cleaned) continue;

    // Extract Thermomix speed/temp/time hints if written in brackets like [5 min / 100°C / Vel 1]
    let thermomixParams: string | undefined;
    let stepText = cleaned;
    const bracketMatch = cleaned.match(/\[([^\]]{3,45})\]\s*$/);
    if (bracketMatch) {
      thermomixParams = bracketMatch[1].trim();
      stepText = cleaned.slice(0, bracketMatch.index).trim();
    }

    steps.push({
      id: createId('step'),
      order: steps.length + 1,
      text: stepText,
      thermomixParams,
    });
  }

  return steps;
}

/**
 * Compresses an uploaded image file on the client so mobile photos upload reliably and fast.
 */
export function compressImageFile(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function buildRecipeShareUrl(recipeId: string): string {
  if (typeof window === 'undefined') return `/receta/${recipeId}`;
  return `${window.location.origin}/receta/${encodeURIComponent(recipeId)}`;
}

export function buildWhatsAppShareUrl(recipe: Recipe, shareUrl: string): string {
  const greeting = recipe.clientName
    ? `¡Hola ${recipe.clientName}! Te comparto la receta interactiva`
    : '¡Hola! Te comparto esta receta interactiva';

  const message = [
    `${greeting} *${recipe.title}* para *Thermomix ${recipe.model}*.`,
    '',
    'Desde el enlace puedes revisar tus ingredientes en casa, filtrar lo que falta por comprar y activar el Modo Cocina sin contraseñas:',
    shareUrl,
    '',
    'Con cariño,',
    'Paulina Rivero — Presentadora de Thermomix',
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
