import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper: choose first non-empty string
function pickString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
  }
  return undefined;
}

// Resolve USDA API key from Expo config/env
const expoExtra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra || {};
const resolvedFromExpo = pickString(expoExtra.usdaApiKey, expoExtra.USDA_API_KEY);
const resolvedFromEnv = pickString(process.env.EXPO_PUBLIC_USDA_API_KEY, process.env.USDA_API_KEY);

const USDA_API_KEY: string = pickString(resolvedFromExpo, resolvedFromEnv) || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'usda_cache_';
const SEARCH_CACHE_PREFIX = 'usda_search_';

// Request throttling
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

export interface USDASearchParams {
  query: string;
  dataType?: string[];
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  rank?: number;
}

export interface USDAFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  gtinUpc?: string;
  publishedDate?: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  marketCountry?: string;
  foodCategory?: string;
  modifiedDate?: string;
  dataSource?: string;
  packageWeight?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: USDANutrient[];
  allHighlightFields?: string;
  score?: number;
}

export interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  pageList: number[];
  foodSearchCriteria: {
    query: string;
    generalSearchInput: string;
    pageNumber: number;
    numberOfResultsPerPage: number;
    pageSize: number;
    requireAllWords: boolean;
  };
  foods: USDAFoodItem[];
  aggregations?: any;
}

export interface ProcessedFoodItem {
  fdcId: number;
  name: string;
  brand?: string;
  category?: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

/**
 * Cache management functions
 */
async function getCachedData(key: string): Promise<any> {
  try {
    const cachedData = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    const now = Date.now();
    
    if (now - parsed.timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

async function setCachedData(key: string, data: any): Promise<void> {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

/**
 * Request throttling function
 */
async function throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }
        
        lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    requestQueue.push(executeRequest);
    processQueue();
  });
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
    }
  }

  isProcessingQueue = false;
}

/**
 * Enhanced search with caching and throttling
 */
export async function searchUSDAFoods(params: USDASearchParams): Promise<USDASearchResponse> {
  // Create cache key from search parameters
  const cacheKey = `${SEARCH_CACHE_PREFIX}${JSON.stringify(params)}`;
  
  // Try to get cached data first
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Make throttled request
  return throttledRequest(async () => {
    const searchParams = new URLSearchParams({
      api_key: USDA_API_KEY,
      query: params.query,
      pageSize: String(params.pageSize || 50), // Increase page size to reduce requests
      pageNumber: String(params.pageNumber || 1),
    });

    if (params.dataType && params.dataType.length > 0) {
      params.dataType.forEach(type => searchParams.append('dataType', type));
    }

    if (params.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }

    if (params.sortOrder) {
      searchParams.set('sortOrder', params.sortOrder);
    }

    const url = `${USDA_BASE_URL}/foods/search?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      // Rate limit exceeded, wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      throw new Error('Rate limit exceeded, please try again');
    }

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the successful response
    await setCachedData(cacheKey, data);
    
    return data;
  });
}

/**
 * Get detailed food information by FDC ID with caching
 */
export async function getUSDAFoodDetails(fdcId: number, format: 'abridged' | 'full' = 'abridged'): Promise<USDAFoodItem> {
  const cacheKey = `food_${fdcId}_${format}`;
  
  // Try cache first
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  return throttledRequest(async () => {
    const searchParams = new URLSearchParams({
      api_key: USDA_API_KEY,
      format,
    });

    const url = `${USDA_BASE_URL}/food/${fdcId}?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      console.log('Rate limit exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      throw new Error('Rate limit exceeded, please try again');
    }

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    await setCachedData(cacheKey, data);
    
    return data;
  });
}

/**
 * Extract nutrient value by nutrient number
 */
function extractNutrient(nutrients: USDANutrient[] = [], nutrientNumber: string): number {
  const nutrient = nutrients.find(n => n.nutrientNumber === nutrientNumber);
  return nutrient ? nutrient.value : 0;
}

/**
 * Process USDA food item into simplified format for the app
 */
export function processUSDAFoodItem(food: USDAFoodItem): ProcessedFoodItem {
  const nutrients = food.foodNutrients || [];
  
  // USDA nutrient numbers for key macronutrients
  const calories = extractNutrient(nutrients, '208'); // Energy (kcal)
  const protein = extractNutrient(nutrients, '203'); // Protein
  const carbs = extractNutrient(nutrients, '205'); // Carbohydrate, by difference
  const fat = extractNutrient(nutrients, '204'); // Total lipid (fat)
  const fiber = extractNutrient(nutrients, '291'); // Fiber, total dietary
  const sugar = extractNutrient(nutrients, '269'); // Sugars, total including NLEA

  // Create serving size text
  let servingSize = '';
  if (food.servingSize && food.servingSizeUnit) {
    servingSize = `${food.servingSize}${food.servingSizeUnit}`;
  } else if (food.householdServingFullText) {
    servingSize = food.householdServingFullText;
  } else {
    servingSize = '100g';
  }

  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandName || food.brandOwner,
    category: food.foodCategory,
    servingSize,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10, // 1 decimal place
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: fiber > 0 ? Math.round(fiber * 10) / 10 : undefined,
    sugar: sugar > 0 ? Math.round(sugar * 10) / 10 : undefined,
  };
}

/**
 * Search and process foods for app consumption with enhanced caching
 */
export async function searchProcessedFoods(query: string, pageSize: number = 50): Promise<ProcessedFoodItem[]> {
  try {
    const response = await searchUSDAFoods({
      query,
      pageSize: Math.min(pageSize, 20), // Limit to reduce API calls
      // Focus on commonly used food types
      dataType: ['Branded', 'SR Legacy', 'Foundation', 'Survey (FNDDS)'],
      sortBy: 'dataType.keyword',
      sortOrder: 'asc'
    });

    return response.foods
      .map(processUSDAFoodItem)
      .slice(0, pageSize); // Return only requested amount
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
}

/**
 * Debounce utility for search input
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}


/**
 * Clear cache (useful for debugging or manual refresh)
 */
export async function clearUSDACache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const usdaKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(usdaKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Preload popular foods to reduce API calls
 */
export async function preloadPopularFoods(): Promise<void> {
  const popularQueries = ['chicken', 'rice', 'banana', 'egg'];
  
  for (const query of popularQueries) {
    try {
      await searchProcessedFoods(query, 10);
      await new Promise(resolve => setTimeout(resolve, 300)); // Delay between preloads
    } catch (error) {
      console.error(`Error preloading ${query}:`, error);
    }
  }
}