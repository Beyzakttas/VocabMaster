// flashcard.js - Interactive 3D Flashcard Controller
const FlashcardModule = {
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
  },

  cacheElements() {
    this.elements = {
      card: document.getElementById('flashcardElement'),
      cardWord: document.getElementById('cardWord'),
      cardPhonetic: document.getElementById('cardPhonetic'),
      cardTypeTag: document.getElementById('cardTypeTag'),
      cardLevelTag: document.getElementById('cardLevelTag'),
      cardBackLevelTag: document.getElementById('cardBackLevelTag'),
      cardSampleEn: document.getElementById('cardSampleEn'),
      cardMeaning: document.getElementById('cardMeaning'),
      cardSentenceTr: document.getElementById('cardSentenceTr'),
      cardSynonyms: document.getElementById('cardSynonyms'),
      deckLevelBadge: document.getElementById('deckLevelBadge'),
      deckCounter: document.getElementById('deckCounter'),
      deckProgressBar: document.getElementById('deckProgressBar'),
      starIcon: document.getElementById('starIcon'),
      btnToggleStar: document.getElementById('btnToggleStar'),
      btnFlipCard: document.getElementById('btnFlipCard'),
      btnPrevCard: document.getElementById('btnPrevCard'),
      btnNextCard: document.getElementById('btnNextCard'),
      btnShuffleCards: document.getElementById('btnShuffleCards'),
      btnPronounce: document.getElementById('btnPronounce'),
      btnCardAudioTrigger: document.getElementById('btnCardAudioTrigger'),
      btnSrsHard: document.getElementById('btnSrsHard'),
      btnSrsReview: document.getElementById('btnSrsReview'),
      btnSrsEasy: document.getElementById('btnSrsEasy')
    };
  },

  bindEvents() {
    const el = this.elements;

    // Flip Card on Click or Button
    if (el.card) {
      el.card.addEventListener('click', (e) => {
        // Don't flip if user clicked speech button
        if (e.target.closest('#btnCardAudioTrigger')) return;
        this.toggleFlip();
      });
    }

    if (el.btnFlipCard) {
      el.btnFlipCard.addEventListener('click', () => this.toggleFlip());
    }

    // Navigation
    if (el.btnPrevCard) {
      el.btnPrevCard.addEventListener('click', () => this.prevCard());
    }
    if (el.btnNextCard) {
      el.btnNextCard.addEventListener('click', () => this.nextCard());
    }

    // Shuffle
    if (el.btnShuffleCards) {
      el.btnShuffleCards.addEventListener('click', () => {
        State.shuffleDeck();
        this.renderCard();
        if (window.App) window.App.showToast('Kelimeler rastgele karıştırıldı!', 'shuffle');
      });
    }

    // Speech
    if (el.btnPronounce) {
      el.btnPronounce.addEventListener('click', () => this.pronounceCurrent());
    }
    if (el.btnCardAudioTrigger) {
      el.btnCardAudioTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pronounceCurrent();
      });
    }

    // Star
    if (el.btnToggleStar) {
      el.btnToggleStar.addEventListener('click', () => {
        const item = this.getCurrentItem();
        if (item) {
          const isStarred = State.toggleStar(item.word);
          this.updateStarUI(isStarred);
          if (window.App) {
            window.App.updateHeaderStats();
            window.App.showToast(isStarred ? `"${item.word}" favorilere eklendi.` : `"${item.word}" favorilerden çıkarıldı.`);
          }
        }
      });
    }

    // SRS Ratings
    if (el.btnSrsHard) {
      el.btnSrsHard.addEventListener('click', () => this.handleSrs('hard'));
    }
    if (el.btnSrsReview) {
      el.btnSrsReview.addEventListener('click', () => this.handleSrs('review'));
    }
    if (el.btnSrsEasy) {
      el.btnSrsEasy.addEventListener('click', () => this.handleSrs('easy'));
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Only when in cards view and not typing in an input
      if (State.activeMode !== 'cards') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevCard();
      } else if (e.code === 'KeyS' || e.code === 'KeyV') {
        e.preventDefault();
        this.pronounceCurrent();
      }
    });
  },

  getCurrentItem() {
    if (!State.shuffledList || State.shuffledList.length === 0) return null;
    return State.shuffledList[State.cardIndex];
  },

  toggleFlip() {
    State.isFlipped = !State.isFlipped;
    if (this.elements.card) {
      this.elements.card.classList.toggle('flipped', State.isFlipped);
    }
  },

  nextCard() {
    if (!State.shuffledList || State.shuffledList.length === 0) return;
    State.isFlipped = false;
    if (this.elements.card) this.elements.card.classList.remove('flipped');
    State.cardIndex = (State.cardIndex + 1) % State.shuffledList.length;
    this.renderCard();
  },

  prevCard() {
    if (!State.shuffledList || State.shuffledList.length === 0) return;
    State.isFlipped = false;
    if (this.elements.card) this.elements.card.classList.remove('flipped');
    State.cardIndex = (State.cardIndex - 1 + State.shuffledList.length) % State.shuffledList.length;
    this.renderCard();
  },

  handleSrs(status) {
    const item = this.getCurrentItem();
    if (!item) return;

    State.markLearned(item.word, status);
    if (window.App) window.App.updateHeaderStats();

    if (status === 'easy') {
      if (window.App) window.App.showToast(`"${item.word}" öğrenildi olarak kaydedildi!`, 'check');
    } else {
      if (window.App) window.App.showToast(`"${item.word}" tekrar listesine eklendi.`, 'clock');
    }

    // Auto navigate to next card smoothly
    setTimeout(() => {
      this.nextCard();
    }, 250);
  },

  pronounceCurrent() {
    const item = this.getCurrentItem();
    if (item && window.SpeechService) {
      window.SpeechService.speak(item.word);
    }
  },

  updateStarUI(isStarred) {
    const el = this.elements;
    if (!el.starIcon || !el.btnToggleStar) return;
    if (isStarred) {
      el.starIcon.className = 'fa-solid fa-star text-amber';
      el.btnToggleStar.classList.add('active');
    } else {
      el.starIcon.className = 'fa-regular fa-star';
      el.btnToggleStar.classList.remove('active');
    }
  },

  renderCard() {
    const el = this.elements;
    const item = this.getCurrentItem();

    if (!item) {
      if (el.cardWord) el.cardWord.textContent = 'Kelime Bulunamadı';
      if (el.cardMeaning) el.cardMeaning.textContent = 'Bu kategoride henüz kelime yok.';
      if (el.deckCounter) el.deckCounter.textContent = '0 / 0';
      if (el.deckProgressBar) el.deckProgressBar.style.width = '0%';
      return;
    }

    // Unflip card when new card is rendered
    if (el.card) el.card.classList.remove('flipped');
    State.isFlipped = false;

    // Front details
    if (el.cardWord) el.cardWord.textContent = item.word;
    if (el.cardPhonetic) el.cardPhonetic.textContent = `/${item.word.toLowerCase()}/`;
    if (el.cardTypeTag) el.cardTypeTag.textContent = item.type || 'Kelime';
    if (el.cardLevelTag) el.cardLevelTag.textContent = item.level;
    if (el.cardBackLevelTag) el.cardBackLevelTag.textContent = item.level;

    // Example sentence formatting (highlight current word)
    if (el.cardSampleEn) {
      if (item.example) {
        const regex = new RegExp(`\\b(${item.word})\\b`, 'gi');
        el.cardSampleEn.innerHTML = item.example.replace(regex, `<strong class="text-indigo">$1</strong>`);
      } else {
        el.cardSampleEn.textContent = `Academic context for '${item.word}' is tested frequently in YDS reading sections.`;
      }
    }

    // Back details
    if (el.cardMeaning) el.cardMeaning.textContent = item.meaning;
    if (el.cardSentenceTr) {
      el.cardSentenceTr.textContent = item.example ? 'YDS sınav soruları ve akademik metinlerde sıkça bu anlamıyla kullanılır.' : 'Akademik bağlamda kullanımı.';
    }

    // Synonyms
    if (el.cardSynonyms) {
      // Mock synonyms if not explicitly provided
      const syns = item.synonyms || [
        `${item.word}-linked term`,
        `academic context`
      ];
      el.cardSynonyms.innerHTML = syns.map(s => `<span class="syn-tag">${s}</span>`).join(' ');
    }

    // Star icon state
    this.updateStarUI(State.isStarred(item.word));

    // Progress bar & Counter
    const current = State.cardIndex + 1;
    const total = State.shuffledList.length;
    if (el.deckCounter) el.deckCounter.textContent = `Kart ${current} / ${total}`;
    if (el.deckProgressBar) {
      const pct = (current / total) * 100;
      el.deckProgressBar.style.width = `${pct}%`;
    }

    // Deck level badge
    if (el.deckLevelBadge) {
      el.deckLevelBadge.textContent = State.activeLevel === 'ALL' ? 'Tüm Seviyeler' : `${State.activeLevel} Seviyesi`;
    }
  }
};

window.FlashcardModule = FlashcardModule;
