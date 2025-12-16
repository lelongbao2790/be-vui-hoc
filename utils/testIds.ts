export const idFor = (component: string, name: string) => `${component}--${name}`;
export const testIdFor = (component: string, name: string) => `${component}__${name}`;

// Common IDs for primary screens
export const APP = {
  ROOT: idFor('app', 'root'),
  HEADER_BACK: idFor('app', 'header-back'),
  TITLE: idFor('app', 'title'),
  SCORE: idFor('app', 'score'),
  MAIN: idFor('app', 'main'),
  FOOTER: idFor('app', 'footer'),
};

export const SELECTORS = {
  AGE: {
    ROOT: idFor('age-selector', 'root'),
    BUTTON: (name: string) => idFor('age-selector', name),
  },
  SUBJECT: {
    ROOT: idFor('subject-selector', 'root'),
    BUTTON: (name: string) => idFor('subject-selector', name),
  },
  LEVEL: {
    ROOT: idFor('level-selector', 'root'),
    BUTTON: (name: string) => idFor('level-selector', name),
  },
  DIFFICULTY: {
    ROOT: idFor('difficulty-selector', 'root'),
    BUTTON: (name: string) => idFor('difficulty-selector', name),
  },
  GAME: {
    ROOT: idFor('game-screen', 'root'),
    GO_HOME: idFor('game-screen', 'go-home'),
    FEEDBACK: idFor('game-screen', 'feedback'),
  }
};
