// state.js - Central State Management & LocalStorage Persistence
const State = {
  // All words organized by level
  data: {
    ALL: [],
    A1: [],
    A2: [],
    B1: [],
    B2: [],
    C1: [],
    C2: []
  },

  // Active user selections
  activeLevel: 'B2',
  activeMode: 'cards', // 'cards' | 'quiz' | 'list'
  
  // Card Navigation State
  cardIndex: 0,
  isFlipped: false,
  shuffledList: [],

  // User Progress persisted in LocalStorage
  userProgress: {
    starred: {}, // { "word": true }
    learned: {}, // { "word": true }
    review: {},  // { "word": true }
    quizScores: {
      totalQuestions: 0,
      totalCorrect: 0
    }
  },

  // Initialize and load persisted data
  init() {
    this.loadFromStorage();
    this.loadVocabulary();
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('yds_user_progress');
      if (saved) {
        this.userProgress = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage access error:', e);
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('yds_user_progress', JSON.stringify(this.userProgress));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  setVocabulary(source) {
    if (!source) return;
    this.data.ALL = [];
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    levels.forEach(lvl => {
      this.data[lvl] = source[lvl] || [];
      this.data.ALL.push(...this.data[lvl]);
    });
    this.prepareDeck();
  },

  loadVocabulary() {
    if (window.YDS_DATA) {
      this.setVocabulary(window.YDS_DATA);
    } else {
      fetch('db/words_by_level.json')
        .then(res => res.json())
        .then(json => {
          this.setVocabulary(json);
          if (window.App && window.App.render) window.App.render();
        })
        .catch(err => console.error('Failed to load vocabulary data:', err));
    }
  },

  getStarredWords() {
    const starred = this.userProgress.starred;
    return this.data.ALL.filter(item => starred[item.word.toLowerCase()]);
  },

  getStarredCount() {
    return Object.values(this.userProgress.starred).filter(Boolean).length;
  },

  getLearnedCount() {
    return Object.values(this.userProgress.learned).filter(Boolean).length;
  },

  getActiveWords() {
    if (this.activeLevel === 'STARRED') {
      return this.getStarredWords();
    }
    return this.data[this.activeLevel] || this.data.B2;
  },

  prepareDeck() {
    const list = this.getActiveWords();
    this.shuffledList = [...list];
    this.cardIndex = 0;
    this.isFlipped = false;
  },

  shuffleDeck() {
    for (let i = this.shuffledList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledList[i], this.shuffledList[j]] = [this.shuffledList[j], this.shuffledList[i]];
    }
    this.cardIndex = 0;
    this.isFlipped = false;
  },

  toggleStar(word) {
    const key = word.toLowerCase();
    this.userProgress.starred[key] = !this.userProgress.starred[key];
    this.saveToStorage();
    return this.userProgress.starred[key];
  },

  isStarred(word) {
    return !!this.userProgress.starred[word.toLowerCase()];
  },

  markLearned(word, status) {
    const key = word.toLowerCase();
    if (status === 'easy') {
      this.userProgress.learned[key] = true;
      delete this.userProgress.review[key];
    } else if (status === 'review' || status === 'hard') {
      this.userProgress.review[key] = true;
      delete this.userProgress.learned[key];
    }
    this.saveToStorage();
  },

  recordQuizResult(correctCount, totalQuestions) {
    this.userProgress.quizScores.totalCorrect += correctCount;
    this.userProgress.quizScores.totalQuestions += totalQuestions;
    this.saveToStorage();
  },

  resetAllProgress() {
    this.userProgress = {
      starred: {},
      learned: {},
      review: {},
      quizScores: { totalQuestions: 0, totalCorrect: 0 }
    };
    this.saveToStorage();
  }
};

window.State = State;
