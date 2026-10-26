// app.js - Main Application Coordinator
const App = {
  init() {
    // 1. Initialize State & Data
    State.init();

    // 2. Initialize Speech Synthesis
    SpeechService.init();

    // 3. Initialize Sub-modules
    FlashcardModule.init();
    QuizModule.init();

    // 4. Bind Global UI Events
    this.bindEvents();

    // 5. Initial Render
    this.render();
  },

  bindEvents() {
    // Theme Toggle (Dark / Light)
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        themeIcon.className = nextTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        localStorage.setItem('yds_theme', nextTheme);
        this.showToast(`${nextTheme === 'dark' ? 'Koyu' : 'Açık'} tema aktif.`);
      });

      // Restore saved theme
      const savedTheme = localStorage.getItem('yds_theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeIcon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
      }
    }

    // Reset Progress Button
    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Tüm öğrenme ilerlemenizi ve test skorlarınızı sıfırlamak istediğinize emin misiniz?')) {
          State.resetAllProgress();
          this.render();
          this.showToast('İlerleme başarıyla sıfırlandı.', 'rotate-left');
        }
      });
    }

    // Level Dropdown Trigger & Outside Click Handling
    const levelDropdownBtn = document.getElementById('levelDropdownBtn');
    const levelDropdownMenu = document.getElementById('levelDropdownMenu');
    if (levelDropdownBtn && levelDropdownMenu) {
      levelDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = levelDropdownMenu.classList.toggle('open');
        levelDropdownBtn.classList.toggle('open', isOpen);
        levelDropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Click outside to close
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#levelDropdownWrapper')) {
          levelDropdownMenu.classList.remove('open');
          levelDropdownBtn.classList.remove('open');
          levelDropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && levelDropdownMenu.classList.contains('open')) {
          levelDropdownMenu.classList.remove('open');
          levelDropdownBtn.classList.remove('open');
          levelDropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Category Tabs & Dropdown Items (ALL, A1, A2, B1, B2, C1, C2, STARRED)
    const categoryTabs = document.querySelectorAll('.cat-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const level = tab.getAttribute('data-level');
        this.selectCategory(level);
      });
    });

    // Mode Switcher Buttons (Cards, VocabQuiz, Quiz, List)
    const modeButtons = {
      btnModeCards: 'cards',
      btnModeVocabQuiz: 'vocabQuiz',
      btnModeQuiz: 'quiz',
      btnModeList: 'list'
    };
    Object.entries(modeButtons).forEach(([id, mode]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.switchMode(mode));
    });

    // Word Search & Dictionary Table Events
    const searchInput = document.getElementById('wordSearchInput');
    const clearSearchBtn = document.getElementById('btnClearSearch');
    const typeSelect = document.getElementById('filterTypeSelect');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
        }
        this.renderWordList();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        this.renderWordList();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', () => this.renderWordList());
    }
  },

  // Level configuration dictionary
  levelConfig: {
    A1: { title: 'A1 · Temel', color: 'var(--lvl-a1)' },
    A2: { title: 'A2 · Başlangıç', color: 'var(--lvl-a2)' },
    B1: { title: 'B1 · Orta Seviye', color: 'var(--lvl-b1)' },
    B2: { title: 'B2 · YDS Ana Havuz', color: '#a78bfa' },
    C1: { title: 'C1 · İleri (80+)', color: 'var(--lvl-c1)' },
    C2: { title: 'C2 · Elit Sınav', color: 'var(--lvl-c2)' }
  },

  updateLevelDropdownDisplay(level) {
    const config = this.levelConfig[level];
    const dropdownBtn = document.getElementById('levelDropdownBtn');
    const dropdownMenu = document.getElementById('levelDropdownMenu');

    if (config) {
      const badge = document.getElementById('dropdownLevelBadge');
      const title = document.getElementById('dropdownLevelTitle');
      const count = document.getElementById('dropdownLevelCount');
      const dot = document.getElementById('dropdownLevelDot');

      if (badge) badge.textContent = level;
      if (title) title.textContent = config.title;
      if (dot) dot.style.background = config.color;
      if (count && State.data[level]) count.textContent = State.data[level].length;
      if (dropdownBtn) dropdownBtn.classList.add('active-level');
    } else if (dropdownBtn) {
      dropdownBtn.classList.remove('active-level');
    }

    // Close dropdown menu if open
    if (dropdownMenu) dropdownMenu.classList.remove('open');
    if (dropdownBtn) {
      dropdownBtn.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  },

  selectCategory(level) {
    State.activeLevel = level;

    // Update Category Tabs Active Class
    document.querySelectorAll('.cat-tab').forEach(tab => {
      const isCurrent = tab.getAttribute('data-level') === level;
      tab.classList.toggle('active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    // Update Dropdown Trigger Display
    this.updateLevelDropdownDisplay(level);

    // Update active word deck
    State.prepareDeck();

    // Re-render Flashcards
    FlashcardModule.renderCard();

    // If currently in Quiz or VocabQuiz mode, restart quiz for the new category
    if (State.activeMode === 'quiz' || State.activeMode === 'vocabQuiz') {
      QuizModule.startQuiz();
    }

    // If currently in List mode, refresh list
    if (State.activeMode === 'list') {
      this.renderWordList();
    }

    // Update count badges
    const currentWords = State.getActiveWords();
    const countBadge = document.getElementById('cardsCountBadge');
    if (countBadge) {
      countBadge.textContent = `${currentWords.length} Kelime`;
    }

    this.showToast(`${level === 'ALL' ? 'Tüm Seviyeler' : level} kategorisi seçildi.`);
  },

  switchMode(mode) {
    State.activeMode = mode;

    // Toggle active state on mode buttons
    const modeBtnIds = {
      cards: 'btnModeCards',
      vocabQuiz: 'btnModeVocabQuiz',
      quiz: 'btnModeQuiz',
      list: 'btnModeList'
    };
    Object.entries(modeBtnIds).forEach(([m, id]) => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('active', m === mode);
    });

    // Toggle active views
    const isQuizMode = (mode === 'quiz' || mode === 'vocabQuiz');
    const viewStates = {
      viewCards: mode === 'cards',
      viewQuiz: isQuizMode,
      viewList: mode === 'list'
    };
    Object.entries(viewStates).forEach(([id, isActive]) => {
      const view = document.getElementById(id);
      if (view) view.classList.toggle('active', isActive);
    });

    // Actions on Mode Entry
    if (mode === 'cards') {
      FlashcardModule.renderCard();
    } else if (mode === 'list') {
      this.renderWordList();
    } else {
      QuizModule.quizFormat = (mode === 'vocabQuiz') ? 'vocab' : 'yds';
      QuizModule.startQuiz();
    }
  },

  updateHeaderStats() {
    const totalWords = State.data.ALL.length || 1243;
    const learnedCount = State.getLearnedCount();
    const starredCount = State.getStarredCount();

    const statTotal = document.getElementById('statTotalWords');
    const statLearned = document.getElementById('statLearnedCount');
    const statAccuracy = document.getElementById('statQuizAccuracy');
    const countStarred = document.getElementById('count-STARRED');

    if (statTotal) statTotal.textContent = totalWords;
    if (statLearned) statLearned.textContent = learnedCount;
    if (countStarred) countStarred.textContent = starredCount;

    // Calculate Quiz Accuracy
    const scores = State.userProgress.quizScores;
    if (statAccuracy) {
      const acc = scores.totalQuestions > 0 ? Math.round((scores.totalCorrect / scores.totalQuestions) * 100) : 0;
      statAccuracy.textContent = `%${acc}`;
    }
  },

  renderWordList() {
    const tbody = document.getElementById('wordsTableBody');
    const searchInput = document.getElementById('wordSearchInput');
    const typeSelect = document.getElementById('filterTypeSelect');
    const countLabel = document.getElementById('filteredCountLabel');

    if (!tbody) return;

    const query = (searchInput ? searchInput.value.toLowerCase().trim() : '');
    const typeFilter = typeSelect ? typeSelect.value : 'ALL';

    // Start with active category words
    let words = State.getActiveWords();

    // Apply text search
    if (query) {
      words = words.filter(item => 
        item.word.toLowerCase().includes(query) ||
        (item.meaning && item.meaning.toLowerCase().includes(query)) ||
        (item.level && item.level.toLowerCase() === query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      words = words.filter(item => item.type && item.type.includes(typeFilter));
    }

    if (countLabel) {
      countLabel.textContent = `${words.length} kelime listeleniyor`;
    }

    if (words.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 0.5rem; display:block; opacity: 0.5;"></i>
            Aramanızla eşleşen kelime bulunamadı.
          </td>
        </tr>
      `;
      return;
    }

    // Render rows (limit to first 100 for high performance)
    const visibleWords = words.slice(0, 100);

    tbody.innerHTML = visibleWords.map((item, idx) => {
      const isStarred = State.isStarred(item.word);
      return `
        <tr>
          <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
          <td>
            <span class="table-word">${item.word}</span>
          </td>
          <td>
            <span class="card-level-tag" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">${item.level}</span>
          </td>
          <td>
            <span class="table-meaning">${item.meaning}</span>
          </td>
          <td>
            <span class="table-example">${item.example || '-'}</span>
          </td>
          <td style="text-align: center;">
            <button class="table-action-btn" title="Telaffuz" onclick="SpeechService.speak('${item.word}')">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <button class="table-action-btn" title="Yıldızla" onclick="App.toggleWordStar('${item.word}', this)">
              <i class="${isStarred ? 'fa-solid fa-star text-amber' : 'fa-regular fa-star'}"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  toggleWordStar(word, btnElement) {
    const isStarred = State.toggleStar(word);
    const icon = btnElement.querySelector('i');
    if (icon) {
      icon.className = isStarred ? 'fa-solid fa-star text-amber' : 'fa-regular fa-star';
    }
    this.updateHeaderStats();
    this.showToast(isStarred ? `"${word}" favorilere eklendi.` : `"${word}" favorilerden çıkarıldı.`);
  },

  showToast(message, iconName = 'info-circle') {
    const toast = document.getElementById('toastBox');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) {
      toastIcon.className = `fa-solid fa-${iconName || 'circle-info'}`;
    }

    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  },

  render() {
    this.updateHeaderStats();
    this.updateLevelDropdownDisplay(State.activeLevel);
    FlashcardModule.renderCard();
    this.renderWordList();
  }
};

window.App = App;

// Start Application on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
