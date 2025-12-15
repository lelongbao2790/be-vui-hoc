
import type { VietnameseWord, EnglishWord, ScrambleSentence, VietnameseRhymePair, EnglishSentence, VietnameseVowelRule } from '../types';

// Cơ chế cache đơn giản để tránh fetch lại file nhiều lần
const cache: Record<string, any> = {};

async function fetchData<T>(filePath: string): Promise<T> {
  if (cache[filePath]) {
    return cache[filePath] as T;
  }
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Network response was not ok for ${filePath}`);
    }
    const data = await response.json();
    cache[filePath] = data;
    return data;
  } catch (error) {
    console.error(`Failed to load data from ${filePath}:`, error);
    // Trả về mảng rỗng để tránh crash game
    return [] as T;
  }
}

// Xuất các hàm để lấy dữ liệu cho từng loại game
export const getVietnameseWords = () => fetchData<VietnameseWord[]>('./data/vietnamese_words.json');
export const getVietnameseScrambleSentences = () => fetchData<ScrambleSentence[]>('./data/vietnamese_scramble.json');
export const getVietnameseRhymes = () => fetchData<VietnameseRhymePair[]>('./data/vietnamese_rhymes.json');
export const getVietnameseVowelRules = () => fetchData<VietnameseVowelRule[]>('./data/vietnamese_vowels.json');

export const getEnglishWords = () => fetchData<EnglishWord[]>('./data/english_words.json');
export const getEnglishSentences = () => fetchData<EnglishSentence[]>('./data/english_sentences.json');
