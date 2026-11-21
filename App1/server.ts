import express from 'express';
import fs from 'fs';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ThermomixModel = 'TM6' | 'TM7';
type IngredientStatus = 'pending' | 'have' | 'missing';

interface IngredientItem {
  id: string;
  text: string;
  note?: string;
  status: IngredientStatus;
}

interface RecipeStep {
  id: string;
  order: number;
  text: string;
  thermomixParams?: string;
}

interface RecipeRecord {
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

interface StoreData {
  recipes: RecipeRecord[];
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'recetario.json');

const SEED_RECIPES: RecipeRecord[] = [
  {
    id: 'crema-calabaza-jengibre',
    title: 'Crema Aterciopelada de Calabaza Asada y Jengibre',
    description:
      'Suave crema otoñal con un toque cálido de jengibre fresco, leche de coco y semillas tostadas. Ideal para demostrar la textura perfecta en Thermomix.',
    model: 'TM6',
    imageUrl: '/src/assets/images/recipe_pumpkin_soup_1795285678497.jpg',
    prepTime: '30 min',
    servings: '4 porciones',
    ingredients: [
      {
        id: 'ing_cal_1',
        text: '700 g de calabaza pelada y en trozos',
        status: 'have',
      },
      {
        id: 'ing_cal_2',
        text: '1 cebolla mediana partida en cuartos',
        status: 'have',
      },
      {
        id: 'ing_cal_3',
        text: '15 g de jengibre fresco pelado',
        note: 'ajustar a gusto',
        status: 'missing',
      },
      {
        id: 'ing_cal_4',
        text: '30 g de aceite de oliva virgen extra',
        status: 'have',
      },
      {
        id: 'ing_cal_5',
        text: '500 g de caldo de verduras natural',
        status: 'missing',
      },
      {
        id: 'ing_cal_6',
        text: '150 g de leche de coco o crema para cocinar',
        note: 'opcional para un acabado más cremoso',
        status: 'pending',
      },
      {
        id: 'ing_cal_7',
        text: '1 cucharadita de sal marina y pimienta negra recién molida',
        status: 'have',
      },
      {
        id: 'ing_cal_8',
        text: 'Semillas de calabaza tostadas y hojas de salvia fresca',
        note: 'opcional para decorar al servir',
        status: 'missing',
      },
    ],
    steps: [
      {
        id: 'step_cal_1',
        order: 1,
        text: 'Pon en el vaso la cebolla y el jengibre fresco. Pica rápidamente para liberar todo su aroma.',
        thermomixParams: '4 seg · Vel 5',
      },
      {
        id: 'step_cal_2',
        order: 2,
        text: 'Baja los restos de las paredes con la espátula, añade el aceite de oliva virgen extra y sofríe suavemente hasta que la cebolla esté transparente.',
        thermomixParams: '5 min · 120°C · Vel 1',
      },
      {
        id: 'step_cal_3',
        order: 3,
        text: 'Incorpora los trozos de calabaza, el caldo de verduras, la sal y la pimienta. Cocina hasta que la calabaza esté tierna.',
        thermomixParams: '18 min · 100°C · Vel 1',
      },
      {
        id: 'step_cal_4',
        order: 4,
        text: 'Agrega la leche de coco y espera 1 minuto a que baje ligeramente la temperatura antes de triturar.',
        thermomixParams: '1 min · Sin tapa',
      },
      {
        id: 'step_cal_5',
        order: 5,
        text: 'Coloca el cubilete y tritura progresivamente de velocidad 5 a 10 hasta obtener una textura aterciopelada.',
        thermomixParams: '1 min · Vel 5 → 10 progresiva',
      },
      {
        id: 'step_cal_6',
        order: 6,
        text: 'Sirve en cuencos templados decorando con un hilo de leche de coco, semillas de calabaza tostadas y hojitas de salvia fresca.',
      },
    ],
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    isSample: true,
  },
  {
    id: 'risotto-hongos-parmesano',
    title: 'Risotto Cremoso de Hongos Silvestres y Parmesano',
    description:
      'Arroz Carnaroli en su punto exacto, sin remover manualmente gracias al giro a la izquierda de Thermomix TM7 y acabado mantecado con queso añejo.',
    model: 'TM7',
    imageUrl: '/src/assets/images/recipe_mushroom_risotto_1795285678465.jpg',
    prepTime: '35 min',
    servings: '4 porciones',
    ingredients: [
      {
        id: 'ing_ris_1',
        text: '60 g de queso parmesano reggiano en trozos',
        status: 'pending',
      },
      {
        id: 'ing_ris_2',
        text: '2 chalotas o 1 cebolla pequeña',
        status: 'have',
      },
      {
        id: 'ing_ris_3',
        text: '40 g de mantequilla sin sal (en dos mitades)',
        status: 'have',
      },
      {
        id: 'ing_ris_4',
        text: '300 g de hongos variados frescos laminados',
        status: 'missing',
      },
      {
        id: 'ing_ris_5',
        text: '320 g de arroz arborio o carnaroli',
        status: 'pending',
      },
      {
        id: 'ing_ris_6',
        text: '80 g de vino blanco seco',
        note: 'opcional, puede sustituirse por caldo',
        status: 'have',
      },
      {
        id: 'ing_ris_7',
        text: '850 g de caldo caliente de ave o verduras',
        status: 'have',
      },
      {
        id: 'ing_ris_8',
        text: 'Ramitas de tomillo fresco',
        note: 'para decorar',
        status: 'missing',
      },
    ],
    steps: [
      {
        id: 'step_ris_1',
        order: 1,
        text: 'Coloca el parmesano en trozos en el vaso limpio y seco para rallarlo al instante. Reserva en un bol.',
        thermomixParams: '10 seg · Vel 10',
      },
      {
        id: 'step_ris_2',
        order: 2,
        text: 'Añade las chalotas y pica finamente. Incorpora 20 g de mantequilla y sofríe suavemente.',
        thermomixParams: '3 seg · Vel 5 / 3 min · 120°C · Vel 1',
      },
      {
        id: 'step_ris_3',
        order: 3,
        text: 'Agrega los hongos laminados y rehoga con giro inverso para mantener su forma.',
        thermomixParams: '4 min · 120°C · Giro inverso · Vel cuchara',
      },
      {
        id: 'step_ris_4',
        order: 4,
        text: 'Incorpora el arroz y nacara sin cubilete. Luego vierte el vino blanco y deja evaporar el alcohol.',
        thermomixParams: '3 min · 100°C · Giro inverso · Vel 1',
      },
      {
        id: 'step_ris_5',
        order: 5,
        text: 'Vierte el caldo caliente, coloca el cestillo sobre la tapa en lugar del cubilete y cocina el risotto.',
        thermomixParams: '14 min · 100°C · Giro inverso · Vel 1',
      },
      {
        id: 'step_ris_6',
        order: 6,
        text: 'Manteca con los 20 g restantes de mantequilla y el parmesano rallado reservado. Deja reposar 2 minutos y sirve con tomillo fresco.',
      },
    ],
    createdAt: '2026-11-20T10:05:00.000Z',
    updatedAt: '2026-11-20T10:05:00.000Z',
    isSample: true,
  },
  {
    id: 'pollo-limon-romero-varoma',
    title: 'Pechugas al Limón y Romero con Papitas al Varoma',
    description:
      'Cocina completa en niveles: jugosas pechugas aromáticas con limón y romero junto a papitas doradas al vapor en una sola preparación.',
    model: 'TM6',
    imageUrl: '/src/assets/images/recipe_lemon_herb_chicken_1795285678816.jpg',
    prepTime: '40 min',
    servings: '4 porciones',
    ingredients: [
      {
        id: 'ing_pol_1',
        text: '600 g de pechuga de pollo en filetes gruesos',
        status: 'pending',
      },
      {
        id: 'ing_pol_2',
        text: '500 g de papitas cambray lavadas con piel',
        status: 'have',
      },
      {
        id: 'ing_pol_3',
        text: '1 limón amarillo en rodajas finas + su ralladura',
        status: 'missing',
      },
      {
        id: 'ing_pol_4',
        text: '2 ramitas de romero fresco y perejil picado',
        status: 'have',
      },
      {
        id: 'ing_pol_5',
        text: '2 dientes de ajo y 30 g de aceite de oliva',
        status: 'have',
      },
      {
        id: 'ing_pol_6',
        text: '500 g de agua para el vapor',
        status: 'have',
      },
      {
        id: 'ing_pol_7',
        text: 'Sal en escamas y pimienta al gusto',
        note: 'ajustar a gusto',
        status: 'have',
      },
    ],
    steps: [
      {
        id: 'step_pol_1',
        order: 1,
        text: 'Pica el ajo con las hojas de romero y el aceite de oliva para preparar la marinada aromática.',
        thermomixParams: '5 seg · Vel 7',
      },
      {
        id: 'step_pol_2',
        order: 2,
        text: 'Unta las pechugas de pollo con la mezcla, añade rodajas de limón encima y colócalas en la bandeja del Varoma.',
      },
      {
        id: 'step_pol_3',
        order: 3,
        text: 'Pon las papitas cambray en el recipiente Varoma dejando ranuras libres para que circule el vapor.',
      },
      {
        id: 'step_pol_4',
        order: 4,
        text: 'Vierte el agua en el vaso, sitúa el Varoma en su posición y cocina al vapor.',
        thermomixParams: '25 min · Varoma · Vel 1',
      },
      {
        id: 'step_pol_5',
        order: 5,
        text: 'Corta el pollo en medallones gruesos, sirve junto a las papitas con sal en escamas y decora con perejil fresco.',
      },
    ],
    createdAt: '2026-11-20T10:10:00.000Z',
    updatedAt: '2026-11-20T10:10:00.000Z',
    isSample: true,
  },
];

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: StoreData = { recipes: SEED_RECIPES };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
      const fallback: StoreData = { recipes: SEED_RECIPES };
      fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    return parsed;
  } catch {
    const fallback: StoreData = { recipes: SEED_RECIPES };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DATA_FILE);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
}

function generateUniqueId(base: string, existingIds: Set<string>): string {
  const cleanBase = slugify(base) || 'receta';
  const suffix = Math.random().toString(36).slice(2, 6);
  let candidate = `${cleanBase}-${suffix}`;
  while (existingIds.has(candidate)) {
    candidate = `${cleanBase}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return candidate;
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '::1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  if (net.isIPv4(lower)) {
    const parts = lower.split('.').map(Number);
    if (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    ) {
      return true;
    }
  }
  return false;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .trim();
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function formatIsoDuration(iso?: string): string | undefined {
  if (!iso || typeof iso !== 'string') return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return iso;
  const hours = match[1] ? Number(match[1]) : 0;
  const mins = match[2] ? Number(match[2]) : 0;
  if (hours && mins) return `${hours} h ${mins} min`;
  if (hours) return `${hours} h`;
  if (mins) return `${mins} min`;
  return undefined;
}

function extractRecipeFromHtml(html: string, sourceUrl: string) {
  let title: string | undefined;
  let description: string | undefined;
  let imageUrl: string | undefined;
  let prepTime: string | undefined;
  let servings: string | undefined;
  const ingredients: Array<{ text: string; note?: string }> = [];
  const steps: Array<{ text: string; thermomixParams?: string }> = [];

  // 1. Parse JSON-LD schema.org/Recipe blocks
  const ldJsonRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const rawJson = match[1].trim();
      const parsed = JSON.parse(rawJson);
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed];

      for (const item of candidates) {
        const typeVal = item?.['@type'];
        const isRecipe =
          typeVal === 'Recipe' ||
          (Array.isArray(typeVal) && typeVal.includes('Recipe'));
        if (!isRecipe) continue;

        if (!title && typeof item.name === 'string') {
          title = decodeHtmlEntities(item.name);
        }
        if (!description && typeof item.description === 'string') {
          description = decodeHtmlEntities(item.description);
        }
        if (!imageUrl && item.image) {
          if (typeof item.image === 'string') imageUrl = item.image;
          else if (Array.isArray(item.image) && typeof item.image[0] === 'string') {
            imageUrl = item.image[0];
          } else if (typeof item.image?.url === 'string') {
            imageUrl = item.image.url;
          }
        }
        if (!prepTime) {
          prepTime = formatIsoDuration(item.totalTime || item.prepTime || item.cookTime);
        }
        if (!servings && item.recipeYield) {
          servings = Array.isArray(item.recipeYield)
            ? String(item.recipeYield[0])
            : String(item.recipeYield);
        }
        if (Array.isArray(item.recipeIngredient) && ingredients.length === 0) {
          for (const ing of item.recipeIngredient) {
            if (typeof ing === 'string' && ing.trim()) {
              ingredients.push({ text: decodeHtmlEntities(ing.trim()) });
            }
          }
        }
        if (Array.isArray(item.recipeInstructions) && steps.length === 0) {
          for (const st of item.recipeInstructions) {
            if (typeof st === 'string' && st.trim()) {
              steps.push({ text: decodeHtmlEntities(st.trim()) });
            } else if (st && typeof st.text === 'string' && st.text.trim()) {
              steps.push({ text: decodeHtmlEntities(st.text.trim()) });
            }
          }
        }
      }
    } catch {
      // Continue scanning other JSON-LD blocks
    }
  }

  // 2. OpenGraph & Meta tags fallback
  const getMeta = (attrName: string, attrVal: string): string | undefined => {
    const re1 = new RegExp(
      `<meta[^>]*${attrName}=["']${attrVal}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i'
    );
    const re2 = new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${attrVal}["'][^>]*>`,
      'i'
    );
    const found = html.match(re1) || html.match(re2);
    return found?.[1] ? decodeHtmlEntities(found[1]) : undefined;
  };

  if (!title) {
    title = getMeta('property', 'og:title') || getMeta('name', 'title');
    if (title) {
      title = title.replace(/\s*[-|]\s*Cookidoo.*$/i, '').trim();
    } else {
      const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleTag?.[1]) {
        title = stripTags(titleTag[1]).replace(/\s*[-|]\s*Cookidoo.*$/i, '').trim();
      }
    }
  }

  if (!imageUrl) {
    imageUrl = getMeta('property', 'og:image') || getMeta('name', 'twitter:image');
  }

  if (!description) {
    description = getMeta('property', 'og:description') || getMeta('name', 'description');
  }

  // 3. Fallback DOM pattern for Cookidoo public ingredient sections
  if (ingredients.length === 0) {
    const ingSectionMatch =
      html.match(/<ul[^>]*id=["']ingredients[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i) ||
      html.match(/<div[^>]*id=["']ingredients[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<section[^>]*class=["'][^"']*ingredients[^"']*["'][^>]*>([\s\S]*?)<\/section>/i);

    if (ingSectionMatch?.[1]) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(ingSectionMatch[1])) !== null) {
        const text = stripTags(liMatch[1]);
        if (text && text.length > 1 && text.length < 180) {
          ingredients.push({ text });
        }
      }
    }
  }

  // 4. Fallback DOM pattern for public steps if available
  if (steps.length === 0) {
    const stepsSectionMatch =
      html.match(/<ol[^>]*id=["']preparation-steps[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i) ||
      html.match(/<ol[^>]*class=["'][^"']*steps[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);

    if (stepsSectionMatch?.[1]) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(stepsSectionMatch[1])) !== null) {
        const text = stripTags(liMatch[1]);
        if (text && text.length > 3) {
          steps.push({ text });
        }
      }
    }
  }

  // Resolve relative image URL if needed
  if (imageUrl && imageUrl.startsWith('/')) {
    try {
      const base = new URL(sourceUrl);
      imageUrl = `${base.origin}${imageUrl}`;
    } catch {
      // keep as is
    }
  }

  return {
    title,
    description,
    imageUrl,
    prepTime,
    servings,
    ingredients,
    steps,
    cookidooUrl: sourceUrl,
  };
}

async function startServer() {
  ensureStore();

  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // List master recipes (and summary of client links)
  app.get('/api/recipes', (_req, res) => {
    const store = ensureStore();
    const masters = store.recipes.filter((r) => !r.parentId);
    const sharedLinks = store.recipes.filter((r) => Boolean(r.parentId));
    res.json({ recipes: masters, sharedLinks });
  });

  // Get a single recipe or shared client link by ID
  app.get('/api/recipes/:id', (req, res) => {
    const store = ensureStore();
    const recipe = store.recipes.find((r) => r.id === req.params.id);
    if (!recipe) {
      res.status(404).json({ error: 'No encontramos esta receta o enlace compartido.' });
      return;
    }
    res.json({ recipe });
  });

  // Create a new master recipe
  app.post('/api/recipes', (req, res) => {
    const body = req.body as Partial<RecipeRecord>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'El título de la receta es obligatorio.' });
      return;
    }

    const store = ensureStore();
    const existingIds = new Set(store.recipes.map((r) => r.id));
    const now = new Date().toISOString();

    const model: ThermomixModel = body.model === 'TM7' ? 'TM7' : 'TM6';
    const ingredients: IngredientItem[] = Array.isArray(body.ingredients)
      ? body.ingredients
          .filter((i) => i && typeof i.text === 'string' && i.text.trim())
          .map((i, idx) => ({
            id: typeof i.id === 'string' && i.id ? i.id : `ing_${Date.now()}_${idx}`,
            text: i.text.trim().slice(0, 240),
            note: typeof i.note === 'string' && i.note.trim() ? i.note.trim().slice(0, 120) : undefined,
            status: i.status === 'have' || i.status === 'missing' ? i.status : 'pending',
          }))
      : [];

    const steps: RecipeStep[] = Array.isArray(body.steps)
      ? body.steps
          .filter((s) => s && typeof s.text === 'string' && s.text.trim())
          .map((s, idx) => ({
            id: typeof s.id === 'string' && s.id ? s.id : `step_${Date.now()}_${idx}`,
            order: idx + 1,
            text: s.text.trim(),
            thermomixParams:
              typeof s.thermomixParams === 'string' && s.thermomixParams.trim()
                ? s.thermomixParams.trim().slice(0, 80)
                : undefined,
          }))
      : [];

    const newRecipe: RecipeRecord = {
      id: generateUniqueId(title, existingIds),
      title: title.slice(0, 160),
      description:
        typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '',
      model,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '',
      prepTime:
        typeof body.prepTime === 'string' && body.prepTime.trim()
          ? body.prepTime.trim().slice(0, 40)
          : '30 min',
      servings:
        typeof body.servings === 'string' && body.servings.trim()
          ? body.servings.trim().slice(0, 40)
          : '4 porciones',
      cookidooUrl:
        typeof body.cookidooUrl === 'string' && body.cookidooUrl.trim()
          ? body.cookidooUrl.trim()
          : undefined,
      ingredients,
      steps,
      createdAt: now,
      updatedAt: now,
    };

    store.recipes.unshift(newRecipe);
    saveStore(store);
    res.status(201).json({ recipe: newRecipe });
  });

  // Update an existing recipe
  app.put('/api/recipes/:id', (req, res) => {
    const store = ensureStore();
    const index = store.recipes.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Receta no encontrada.' });
      return;
    }

    const existing = store.recipes[index];
    const body = req.body as Partial<RecipeRecord>;

    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim().slice(0, 160)
        : existing.title;

    const updated: RecipeRecord = {
      ...existing,
      title,
      description:
        typeof body.description === 'string'
          ? body.description.trim().slice(0, 500)
          : existing.description,
      model: body.model === 'TM7' ? 'TM7' : body.model === 'TM6' ? 'TM6' : existing.model,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : existing.imageUrl,
      prepTime:
        typeof body.prepTime === 'string' && body.prepTime.trim()
          ? body.prepTime.trim().slice(0, 40)
          : existing.prepTime,
      servings:
        typeof body.servings === 'string' && body.servings.trim()
          ? body.servings.trim().slice(0, 40)
          : existing.servings,
      cookidooUrl:
        typeof body.cookidooUrl === 'string' ? body.cookidooUrl.trim() || undefined : existing.cookidooUrl,
      ingredients: Array.isArray(body.ingredients)
        ? body.ingredients
            .filter((i) => i && typeof i.text === 'string' && i.text.trim())
            .map((i, idx) => ({
              id: typeof i.id === 'string' && i.id ? i.id : `ing_${Date.now()}_${idx}`,
              text: i.text.trim().slice(0, 240),
              note:
                typeof i.note === 'string' && i.note.trim() ? i.note.trim().slice(0, 120) : undefined,
              status: i.status === 'have' || i.status === 'missing' ? i.status : 'pending',
            }))
        : existing.ingredients,
      steps: Array.isArray(body.steps)
        ? body.steps
            .filter((s) => s && typeof s.text === 'string' && s.text.trim())
            .map((s, idx) => ({
              id: typeof s.id === 'string' && s.id ? s.id : `step_${Date.now()}_${idx}`,
              order: idx + 1,
              text: s.text.trim(),
              thermomixParams:
                typeof s.thermomixParams === 'string' && s.thermomixParams.trim()
                  ? s.thermomixParams.trim().slice(0, 80)
                  : undefined,
            }))
        : existing.steps,
      updatedAt: new Date().toISOString(),
    };

    store.recipes[index] = updated;
    saveStore(store);
    res.json({ recipe: updated });
  });

  // Delete a recipe
  app.delete('/api/recipes/:id', (req, res) => {
    const store = ensureStore();
    const masters = store.recipes.filter((r) => !r.parentId);
    const target = store.recipes.find((r) => r.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Receta no encontrada.' });
      return;
    }
    if (!target.parentId && masters.length <= 1) {
      res.status(400).json({ error: 'Debe quedar al menos una receta activa en tu recetario.' });
      return;
    }
    store.recipes = store.recipes.filter((r) => r.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  // Generate an independent shareable link /receta/[id] for a specific client
  app.post('/api/recipes/:id/share', (req, res) => {
    const store = ensureStore();
    const source = store.recipes.find((r) => r.id === req.params.id);
    if (!source) {
      res.status(404).json({ error: 'No se encontró la receta origen.' });
      return;
    }

    const clientName =
      typeof req.body?.clientName === 'string' ? req.body.clientName.trim().slice(0, 60) : '';
    const resetChecks = req.body?.resetChecks !== false;

    const existingIds = new Set(store.recipes.map((r) => r.id));
    const slugBase = clientName ? `${clientName}-${source.title}` : source.title;
    const shareId = generateUniqueId(slugBase, existingIds);
    const now = new Date().toISOString();

    const sharedRecipe: RecipeRecord = {
      ...source,
      id: shareId,
      parentId: source.parentId || source.id,
      clientName: clientName || undefined,
      isSample: false,
      ingredients: source.ingredients.map((ing, idx) => ({
        ...ing,
        id: `${ing.id}_${idx}`,
        status: resetChecks ? 'pending' : ing.status,
      })),
      steps: source.steps.map((st) => ({ ...st })),
      createdAt: now,
      updatedAt: now,
    };

    store.recipes.push(sharedRecipe);
    saveStore(store);
    res.status(201).json({ recipe: sharedRecipe });
  });

  // Update pantry checkmarks for a specific recipe / shared link ID
  app.patch('/api/recipes/:id/pantry', (req, res) => {
    const store = ensureStore();
    const index = store.recipes.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Enlace de receta no encontrado.' });
      return;
    }

    const recipe = store.recipes[index];
    const { ingredientId, status, resetAll } = req.body as {
      ingredientId?: string;
      status?: IngredientStatus;
      resetAll?: boolean;
    };

    if (resetAll) {
      recipe.ingredients = recipe.ingredients.map((ing) => ({ ...ing, status: 'pending' }));
    } else if (
      typeof ingredientId === 'string' &&
      (status === 'pending' || status === 'have' || status === 'missing')
    ) {
      recipe.ingredients = recipe.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, status } : ing
      );
    } else {
      res.status(400).json({ error: 'Datos de actualización inválidos.' });
      return;
    }

    recipe.updatedAt = new Date().toISOString();
    store.recipes[index] = recipe;
    saveStore(store);
    res.json({ recipe });
  });

  // Public Cookidoo URL extractor with graceful Plan B fallback
  app.post('/api/cookidoo/extract', async (req, res) => {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Pega un enlace público de Cookidoo para intentar cargarlo.' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'El enlace ingresado no tiene un formato de URL válido.' });
      return;
    }

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      res.status(400).json({ error: 'Solo se admiten enlaces web http o https.' });
      return;
    }

    if (isBlockedHost(parsedUrl.hostname)) {
      res.status(400).json({ error: 'La dirección ingresada no es un enlace público válido.' });
      return;
    }

    try {
      const response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(7000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      });

      if (!response.ok) {
        res.json({
          success: false,
          partial: false,
          blocked: true,
          message:
            'Cookidoo restringió la lectura automática de este enlace (muy común en la versión gratuita). Usa el Ingreso Manual Inteligente debajo para pegar la receta al instante.',
          data: {
            ingredients: [],
            steps: [],
            cookidooUrl: parsedUrl.toString(),
          },
        });
        return;
      }

      const html = await response.text();
      const extracted = extractRecipeFromHtml(html, parsedUrl.toString());

      const hasTitle = Boolean(extracted.title && !/login|iniciar sesi[oó]n|cookidoo/i.test(extracted.title));
      const hasIngredients = extracted.ingredients.length > 0;
      const hasSteps = extracted.steps.length > 0;

      if (!hasTitle && !hasIngredients) {
        res.json({
          success: false,
          partial: false,
          blocked: true,
          message:
            'Esta vista pública de Cookidoo no expuso los datos sin iniciar sesión. Activa tu Plan B: pega los ingredientes y pasos en los cuadros de abajo y la app los ordenará automáticamente.',
          data: {
            ...extracted,
            title: undefined,
          },
        });
        return;
      }

      if (!hasIngredients || !hasSteps) {
        res.json({
          success: true,
          partial: true,
          blocked: false,
          message: !hasIngredients
            ? 'Cargamos la portada de la receta, pero Cookidoo ocultó los ingredientes. Pégalos en bloque aquí abajo para separarlos automáticamente.'
            : 'Cargamos título, foto e ingredientes. Como Cookidoo gratuito oculta el paso a paso completo, pega o escribe los pasos en el Plan B.',
          data: extracted,
        });
        return;
      }

      res.json({
        success: true,
        partial: false,
        blocked: false,
        message: 'Receta importada desde Cookidoo correctamente. Puedes revisarla o ajustarla antes de guardar.',
        data: extracted,
      });
    } catch {
      res.json({
        success: false,
        partial: false,
        blocked: true,
        message:
          'No se pudo conectar automáticamente con el enlace de Cookidoo. No te preocupes: pega la lista de ingredientes y pasos en el Plan B manual y quedará lista en segundos.',
        data: {
          ingredients: [],
          steps: [],
          cookidooUrl: parsedUrl.toString(),
        },
      });
    }
  });

  const httpServer = http.createServer(app);

  // Vite dev middleware or production static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) {
          next();
          return;
        }
        const safeClientCode = result.code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR WebSocket connection disabled */'
        );
        res.type('application/javascript').send(safeClientCode);
      } catch (err) {
        next(err);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = isProd ? Number(process.env.PORT) || 3000 : 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Recetario Interactivo - Paulina Rivero escuchando en puerto ${port}`);
  });
}

startServer();
