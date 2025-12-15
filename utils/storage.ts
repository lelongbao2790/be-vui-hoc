
import type { Subject } from '../types';

const HIGH_SCORES_KEY = 'beVuiHocHighScores';

export const loadHighScores = (): Record<string, number> => {
  try {
    const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY);
    if (scoresJSON) {
      return JSON.parse(scoresJSON);
    }
  } catch (error) {
    console.error("Failed to load high scores from localStorage", error);
  }
  return {};
};

export const saveHighScores = (scores: Record<string, number>): void => {
  try {
    const scoresJSON = JSON.stringify(scores);
    localStorage.setItem(HIGH_SCORES_KEY, scoresJSON);
  } catch (error) {
    console.error("Failed to save high scores to localStorage", error);
  }
};
