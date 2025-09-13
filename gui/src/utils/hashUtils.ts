import * as Crypto from 'expo-crypto';
import { staticUrls } from '@/src/services/api';

/**
 * Generate SHA-512 hash from text
 */
export const generateSHA512Hash = async (text: string): Promise<string> => {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      text,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash;
  } catch (error) {
    console.error('Failed to generate SHA-512 hash:', error);
    throw new Error('Hash generation failed');
  }
};

/**
 * Get image URL from native word using SHA-512 hash
 */
export const getImageUrlFromNativeWord = async (nativeWord: string): Promise<string> => {
  const hash = await generateSHA512Hash(nativeWord.trim().toLowerCase());
  return staticUrls.getImageUrl(hash);
};

/**
 * Get audio URL from study word using SHA-512 hash
 */
export const getAudioUrlFromStudyWord = async (studyWord: string): Promise<string> => {
  const hash = await generateSHA512Hash(studyWord.trim().toLowerCase());
  return staticUrls.getAudioUrl(hash);
};

/**
 * Precomputed hash cache for performance
 */
interface HashCache {
  [key: string]: string;
}

class HashUtilsCache {
  private cache: HashCache = {};
  private maxCacheSize = 1000;

  async getOrGenerateHash(text: string): Promise<string> {
    const normalizedText = text.trim().toLowerCase();
    
    if (this.cache[normalizedText]) {
      return this.cache[normalizedText];
    }

    const hash = await generateSHA512Hash(normalizedText);
    
    // Manage cache size
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const keys = Object.keys(this.cache);
      const keysToRemove = keys.slice(0, Math.floor(this.maxCacheSize * 0.2));
      keysToRemove.forEach(key => delete this.cache[key]);
    }
    
    this.cache[normalizedText] = hash;
    return hash;
  }

  clearCache(): void {
    this.cache = {};
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

// Global cache instance
const hashCache = new HashUtilsCache();

/**
 * Cached version of hash generation for better performance
 */
export const getCachedHash = (text: string): Promise<string> => {
  return hashCache.getOrGenerateHash(text);
};

/**
 * Get cached image URL from native word
 */
export const getCachedImageUrl = async (nativeWord: string): Promise<string> => {
  const hash = await getCachedHash(nativeWord);
  return staticUrls.getImageUrl(hash);
};

/**
 * Get cached audio URL from study word
 */
export const getCachedAudioUrl = async (studyWord: string): Promise<string> => {
  const hash = await getCachedHash(studyWord);
  return staticUrls.getAudioUrl(hash);
};

/**
 * Validate if a file URL is accessible
 */
export const validateFileUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get image URL with fallback validation
 */
export const getValidatedImageUrl = async (nativeWord: string): Promise<string | null> => {
  try {
    const imageUrl = await getCachedImageUrl(nativeWord);
    const isValid = await validateFileUrl(imageUrl);
    return isValid ? imageUrl : null;
  } catch (error) {
    console.error('Failed to validate image URL:', error);
    return null;
  }
};

/**
 * Get audio URL with fallback validation
 */
export const getValidatedAudioUrl = async (studyWord: string): Promise<string | null> => {
  try {
    const audioUrl = await getCachedAudioUrl(studyWord);
    const isValid = await validateFileUrl(audioUrl);
    return isValid ? audioUrl : null;
  } catch (error) {
    console.error('Failed to validate audio URL:', error);
    return null;
  }
};

/**
 * Preload multiple files for better UX
 */
export const preloadFiles = async (
  nativeWords: string[],
  studyWords: string[]
): Promise<{
  imageUrls: Array<{ word: string; url: string | null }>;
  audioUrls: Array<{ word: string; url: string | null }>;
}> => {
  try {
    // Generate all hashes in parallel
    const imagePromises = nativeWords.map(async (word) => ({
      word,
      url: await getValidatedImageUrl(word),
    }));

    const audioPromises = studyWords.map(async (word) => ({
      word,
      url: await getValidatedAudioUrl(word),
    }));

    const [imageUrls, audioUrls] = await Promise.all([
      Promise.all(imagePromises),
      Promise.all(audioPromises),
    ]);

    return { imageUrls, audioUrls };
  } catch (error) {
    console.error('Failed to preload files:', error);
    return { imageUrls: [], audioUrls: [] };
  }
};

/**
 * Clear hash cache (useful for memory management)
 */
export const clearHashCache = (): void => {
  hashCache.clearCache();
};

/**
 * Get cache statistics
 */
export const getHashCacheStats = (): { size: number; maxSize: number } => {
  return {
    size: hashCache.getCacheSize(),
    maxSize: 1000,
  };
};

/**
 * File types supported by the hash system
 */
export const SUPPORTED_FILE_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
} as const;

/**
 * File extensions for each type
 */
export const FILE_EXTENSIONS = {
  IMAGE: '.jpg',
  AUDIO: '.mp3',
} as const;

/**
 * Helper to get full file URL with proper extension
 */
export const getHashedFileUrl = async (
  text: string,
  fileType: keyof typeof SUPPORTED_FILE_TYPES,
  baseUrl: string
): Promise<string> => {
  const hash = await getCachedHash(text);
  const extension = FILE_EXTENSIONS[fileType];
  return `${baseUrl}/${hash}${extension}`;
};

export default {
  generateSHA512Hash,
  getImageUrlFromNativeWord,
  getAudioUrlFromStudyWord,
  getCachedHash,
  getCachedImageUrl,
  getCachedAudioUrl,
  validateFileUrl,
  getValidatedImageUrl,
  getValidatedAudioUrl,
  preloadFiles,
  clearHashCache,
  getHashCacheStats,
  getHashedFileUrl,
  SUPPORTED_FILE_TYPES,
  FILE_EXTENSIONS,
};