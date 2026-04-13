import axios from 'axios';
import config from '../config';

let cachedTemplates = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (matches backend Cache-Control)

/**
 * Fetch gig templates from the API. Results are cached in memory for 24h.
 * Endpoint is AllowAnonymous — no auth required.
 */
export async function fetchGigTemplates() {
  const now = Date.now();
  if (cachedTemplates && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTemplates;
  }

  const response = await axios.get(`${config.BASE_URL}/GigTemplates`);
  cachedTemplates = response.data;
  cacheTimestamp = now;
  return cachedTemplates;
}

/**
 * Transform API response into the legacy { categoryName: subcategoryNames[] } shape
 * so existing GigsCard category/subcategory logic works unchanged.
 */
export function buildCategoriesMap(templates) {
  if (!templates?.categories) return {};
  const map = {};
  for (const cat of templates.categories) {
    map[cat.name] = (cat.subcategories || []).map(sub => sub.name);
  }
  return map;
}

/**
 * Get all tags for a given category (categoryTags + all subcategory tags, deduplicated).
 */
export function getTagsForCategory(templates, categoryName) {
  if (!templates?.categories) return [];
  const cat = templates.categories.find(c => c.name === categoryName);
  if (!cat) return [];
  const tagSet = new Set(cat.categoryTags || []);
  for (const sub of cat.subcategories || []) {
    for (const tag of sub.tags || []) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet);
}

/**
 * Get tags for specific selected subcategories within a category.
 */
export function getTagsForSubcategories(templates, categoryName, subcategoryNames) {
  if (!templates?.categories) return [];
  const cat = templates.categories.find(c => c.name === categoryName);
  if (!cat) return [];
  const tagSet = new Set(cat.categoryTags || []);
  for (const sub of cat.subcategories || []) {
    if (subcategoryNames.includes(sub.name)) {
      for (const tag of sub.tags || []) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet);
}

/**
 * Get sample tasks for selected subcategories within a category.
 */
export function getSampleTasks(templates, categoryName, subcategoryNames) {
  if (!templates?.categories) return [];
  const cat = templates.categories.find(c => c.name === categoryName);
  if (!cat) return [];
  const tasks = [];
  const seen = new Set();
  for (const sub of cat.subcategories || []) {
    if (subcategoryNames.includes(sub.name)) {
      for (const task of sub.sampleTasks || []) {
        if (!seen.has(task.text)) {
          seen.add(task.text);
          tasks.push(task);
        }
      }
    }
  }
  return tasks;
}

export function clearCache() {
  cachedTemplates = null;
  cacheTimestamp = 0;
}
