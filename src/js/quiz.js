// quiz.js - 5-Option YDS & Pure Vocabulary Quiz Engine
const QuizModule = {
  elements: {},
  currentQuestions: [],
  currentIndex: 0,
  score: 0,
  timerInterval: null,
  timerSeconds: 0,
  answered: false,
  userAnswers: {},
  autoNextTimeout: null,
  quizFormat: 'vocab', // 'vocab' (Sadece Kelime Testi) | 'yds' (5 Şıklı YDS Cümle Testi)

  init() {
    this.cacheElements();
    this.bindEvents();
  },

  cacheElements() {
    this.elements = {
      viewQuiz: document.getElementById('viewQuiz'),
      btnFormatVocab: document.getElementById('btnFormatVocab'),
      btnFormatYds: document.getElementById('btnFormatYds'),
      quizLevelChip: document.getElementById('quizLevelChip'),
      quizQCounter: document.getElementById('quizQCounter'),
      quizProgressBar: document.getElementById('quizProgressBar'),
      quizTimerText: document.getElementById('quizTimerText'),
      quizScoreText: document.getElementById('quizScoreText'),
      quizTypeBadge: document.getElementById('quizTypeBadge'),
      quizDifficultyBadge: document.getElementById('quizDifficultyBadge'),
      quizQuestionPrompt: document.getElementById('quizQuestionPrompt'),
      quizQuestionSentence: document.getElementById('quizQuestionSentence'),
      quizOptionsList: document.getElementById('quizOptionsList'),
      quizFeedbackBox: document.getElementById('quizFeedbackBox'),
      feedbackStatus: document.getElementById('feedbackStatus'),
      feedbackIcon: document.getElementById('feedbackIcon'),
      feedbackTitle: document.getElementById('feedbackTitle'),
      feedbackExplanation: document.getElementById('feedbackExplanation'),
      btnPrevQuestion: document.getElementById('btnPrevQuestion'),
      btnNextQuestion: document.getElementById('btnNextQuestion'),
      btnNextQuestionText: document.getElementById('btnNextQuestionText'),
      btnNextQuestionIcon: document.getElementById('btnNextQuestionIcon'),
      quizAutoIndicator: document.getElementById('quizAutoIndicator'),
      quizResultsScreen: document.getElementById('quizResultsScreen'),
      quizCardElement: document.getElementById('quizCardElement'),
      resultsSubtitle: document.getElementById('resultsSubtitle'),
      resTotalQ: document.getElementById('resTotalQ'),
      resCorrect: document.getElementById('resCorrect'),
      resWrong: document.getElementById('resWrong'),
      resAccuracy: document.getElementById('resAccuracy'),
      btnRestartQuiz: document.getElementById('btnRestartQuiz'),
      btnBackToCards: document.getElementById('btnBackToCards')
    };
  },

  bindEvents() {
    const el = this.elements;

    // Quiz Format Pills (Sadece Kelime Testi vs 5 Şıklı YDS Testi)
    if (el.btnFormatVocab) {
      el.btnFormatVocab.addEventListener('click', () => this.switchFormat('vocab'));
    }
    if (el.btnFormatYds) {
      el.btnFormatYds.addEventListener('click', () => this.switchFormat('yds'));
    }

    if (el.btnPrevQuestion) {
      el.btnPrevQuestion.addEventListener('click', () => this.prevQuestion());
    }

    if (el.btnNextQuestion) {
      el.btnNextQuestion.addEventListener('click', () => this.nextQuestion());
    }

    if (el.btnRestartQuiz) {
      el.btnRestartQuiz.addEventListener('click', () => this.startQuiz());
    }

    if (el.btnBackToCards) {
      el.btnBackToCards.addEventListener('click', () => {
        if (window.App) window.App.switchMode('cards');
      });
    }

    // Keyboard Shortcuts for Quiz Navigation & Answering
    document.addEventListener('keydown', (e) => {
      if (window.State && !['quiz', 'vocabQuiz'].includes(window.State.activeMode)) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (this.elements.quizResultsScreen && this.elements.quizResultsScreen.style.display !== 'none') return;

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevQuestion();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextQuestion();
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        const btns = this.elements.quizOptionsList ? this.elements.quizOptionsList.querySelectorAll('.quiz-opt') : [];
        if (btns[idx] && !this.answered) {
          btns[idx].click();
        }
      } else if (['KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE'].includes(e.code)) {
        const letter = e.code.replace('Key', '');
        const btn = this.elements.quizOptionsList ? this.elements.quizOptionsList.querySelector(`.quiz-opt[data-opt="${letter}"]`) : null;
        if (btn && !this.answered) {
          btn.click();
        }
      }
    });
  },

  syncFormatPills() {
    const isVocab = (this.quizFormat === 'vocab');
    if (this.elements.btnFormatVocab) this.elements.btnFormatVocab.classList.toggle('active', isVocab);
    if (this.elements.btnFormatYds) this.elements.btnFormatYds.classList.toggle('active', !isVocab);

    const btnVocab = document.getElementById('btnModeVocabQuiz');
    const btnYds = document.getElementById('btnModeQuiz');
    if (btnVocab) btnVocab.classList.toggle('active', isVocab);
    if (btnYds) btnYds.classList.toggle('active', !isVocab);
  },

  renderFeedback(isCorrect, target) {
    const el = this.elements;
    if (el.feedbackStatus) {
      el.feedbackStatus.innerHTML = isCorrect
        ? '<i class="fa-solid fa-circle-check text-emerald"></i> <span style="color:#34d399;">Tebrikler! Doğru Cevap.</span>'
        : '<i class="fa-solid fa-circle-xmark text-rose"></i> <span style="color:#fb7185;">Maalesef Yanlış.</span>';
    }
    if (el.feedbackExplanation) {
      el.feedbackExplanation.innerHTML = `
        <strong>${target.word}</strong>: ${target.meaning} <br>
        ${target.example ? `<span style="font-size:0.88rem; color:#94a3b8; display:block; margin-top:0.35rem;"><em>Örnek:</em> ${target.example}</span>` : ''}
      `;
    }
    if (el.quizFeedbackBox) el.quizFeedbackBox.style.display = 'block';
  },

  switchFormat(format) {
    this.quizFormat = format;
    this.syncFormatPills();

    if (window.App) {
      window.App.showToast(format === 'vocab' ? 'Sadece Kelime Testi Modu seçildi.' : '5 Şıklı YDS Cümle Testi seçildi.');
    }

    this.startQuiz();
  },

  startQuiz() {
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = {};
    this.answered = false;
    this.timerSeconds = 0;
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    this.syncFormatPills();

    // Reset results screen
    if (this.elements.quizResultsScreen) this.elements.quizResultsScreen.style.display = 'none';
    if (this.elements.quizCardElement) this.elements.quizCardElement.style.display = 'flex';

    // Start timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      if (this.elements.quizTimerText) {
        this.elements.quizTimerText.textContent = `${mins}:${secs}`;
      }
    }, 1000);

    // Generate questions for active category & format
    this.generateQuestions();
    this.renderCurrentQuestion();
  },

  generateQuestions() {
    const pool = State.getActiveWords();
    const sourceList = (!pool || pool.length < 5) ? State.data.ALL : pool;
    const questionCount = Math.min(10, sourceList.length);
    this.currentQuestions = this.buildQuestionsFromList(sourceList, questionCount);
  },

  buildQuestionsFromList(list, count) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return selected.map((target, idx) => {
      // Pick 4 distractors from list (excluding target word)
      const distractors = list
        .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

      let questionType = 'vocab_en_to_tr';
      let rawOptions = [];

      if (this.quizFormat === 'vocab') {
        // SADECE KELİME TESTİ
        // %50 İngilizce -> Türkçe Anlam, %50 Türkçe Anlam -> İngilizce Kelime
        if (idx % 2 === 0) {
          questionType = 'vocab_en_to_tr';
          rawOptions = [
            { text: target.meaning, correct: true },
            ...distractors.map(d => ({ text: d.meaning, correct: false }))
          ];
        } else {
          questionType = 'vocab_tr_to_en';
          rawOptions = [
            { text: target.word, meaning: target.meaning, correct: true },
            ...distractors.map(d => ({ text: d.word, meaning: d.meaning, correct: false }))
          ];
        }
      } else {
        // 5 ŞIKLI YDS CÜMLE TESTİ (ÖSYM FORMATI)
        const hasSentence = !!target.example && target.example.length > 15;
        questionType = hasSentence ? 'yds_sentence' : 'vocab_tr_to_en';

        rawOptions = [
          { text: target.word, meaning: target.meaning, correct: true },
          ...distractors.map(d => ({ text: d.word, meaning: d.meaning, correct: false }))
        ];
      }

      // Shuffle the 5 options
      const options = rawOptions.sort(() => 0.5 - Math.random());
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const finalizedOptions = options.map((opt, i) => ({
        ...opt,
        label: letters[i]
      }));

      return {
        target,
        type: questionType,
        options: finalizedOptions
      };
    });
  },

  renderCurrentQuestion() {
    const el = this.elements;
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    if (this.currentIndex >= this.currentQuestions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.currentQuestions[this.currentIndex];
    const target = q.target;

    // Check if this question was already answered by user
    const existingAnswer = this.userAnswers[this.currentIndex];
    this.answered = !!existingAnswer;

    // Hide auto indicator
    if (el.quizAutoIndicator) el.quizAutoIndicator.style.display = 'none';

    // Update Progress & Meta
    const currentNum = this.currentIndex + 1;
    const totalQ = this.currentQuestions.length;
    if (el.quizQCounter) el.quizQCounter.textContent = `Soru ${currentNum} / ${totalQ}`;
    if (el.quizProgressBar) el.quizProgressBar.style.width = `${(currentNum / totalQ) * 100}%`;
    if (el.quizScoreText) el.quizScoreText.textContent = `${this.score} Doğru`;
    
    const levelLabel = State.activeLevel === 'ALL' ? 'Genel' : State.activeLevel;
    const formatLabel = this.quizFormat === 'vocab' ? 'Kelime Testi' : 'YDS Cümle Testi';
    if (el.quizLevelChip) el.quizLevelChip.textContent = `${levelLabel} · ${formatLabel}`;
    if (el.quizDifficultyBadge) el.quizDifficultyBadge.textContent = `${target.level} Seviyesi`;

    // Update Previous / Next Buttons
    if (el.btnPrevQuestion) {
      el.btnPrevQuestion.disabled = (this.currentIndex === 0);
    }
    if (el.btnNextQuestionText) {
      el.btnNextQuestionText.textContent = (this.currentIndex === totalQ - 1) ? 'Testi Bitir' : 'Sonraki Soru';
    }
    if (el.btnNextQuestionIcon) {
      el.btnNextQuestionIcon.className = (this.currentIndex === totalQ - 1) ? 'fa-solid fa-flag-checkered' : 'fa-solid fa-arrow-right';
    }

    // Render Question Text Based on Question Type
    if (q.type === 'vocab_en_to_tr') {
      if (el.quizTypeBadge) el.quizTypeBadge.textContent = 'SAF KELİME TESTİ · İNGİLİZCE ➔ TÜRKÇE';
      if (el.quizQuestionPrompt) el.quizQuestionPrompt.textContent = 'Aşağıdaki kelimenin doğru Türkçe karşılığını seçiniz:';
      if (el.quizQuestionSentence) {
        el.quizQuestionSentence.innerHTML = `
          <div class="vocab-word-box">
            <span class="vocab-target-word">${target.word}</span>
            <button class="vocab-sound-btn" onclick="SpeechService.speak('${target.word}')" title="Telaffuzu Dinle (Web Speech API)">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <span class="vocab-target-type">${target.type || 'akademik'}</span>
          </div>
        `;
      }
    } else if (q.type === 'vocab_tr_to_en') {
      if (el.quizTypeBadge) el.quizTypeBadge.textContent = 'SAF KELİME TESTİ · TÜRKÇE ➔ İNGİLİZCE';
      if (el.quizQuestionPrompt) el.quizQuestionPrompt.textContent = 'Aşağıdaki Türkçe anlamı karşılayan İngilizce kelimeyi seçiniz:';
      if (el.quizQuestionSentence) {
        el.quizQuestionSentence.innerHTML = `
          <div class="vocab-word-box">
            <span class="vocab-target-word tr-meaning">"${target.meaning}"</span>
          </div>
        `;
      }
    } else {
      // YDS Academic Sentence Completion
      if (el.quizTypeBadge) el.quizTypeBadge.textContent = 'YDS AKADEMİK CÜMLE TAMAMLAMA (ÖSYM FORMATI)';
      if (el.quizQuestionPrompt) el.quizQuestionPrompt.textContent = 'Aşağıdaki cümlede boş bırakılan yere gelebilecek en uygun kelimeyi işaretleyiniz:';
      
      const regex = new RegExp(`\\b(${target.word})\\b`, 'gi');
      const blankedSentence = target.example.replace(regex, `<span class="blank-spot">______</span>`);
      if (el.quizQuestionSentence) el.quizQuestionSentence.innerHTML = blankedSentence;
    }

    // Render 5 Options (A, B, C, D, E)
    if (el.quizOptionsList) {
      el.quizOptionsList.innerHTML = q.options.map(opt => {
        let extraClass = '';
        if (existingAnswer) {
          if (opt.label === existingAnswer.selectedLabel) {
            extraClass = existingAnswer.isCorrect ? 'correct' : 'wrong';
          } else if (opt.correct) {
            extraClass = 'correct';
          }
        }
        return `
          <button class="quiz-opt ${extraClass}" data-opt="${opt.label}" data-correct="${opt.correct}" ${existingAnswer ? 'disabled' : ''}>
            <span class="opt-label">${opt.label}</span>
            <span class="opt-text">${opt.text}</span>
          </button>
        `;
      }).join('');

      // Add click listeners to options if not already answered
      if (!existingAnswer) {
        el.quizOptionsList.querySelectorAll('.quiz-opt').forEach(btn => {
          btn.addEventListener('click', () => this.handleAnswerSelect(btn, q));
        });
      }
    }

    // Feedback box handling
    if (existingAnswer) {
      this.renderFeedback(existingAnswer.isCorrect, q.target);
    } else if (el.quizFeedbackBox) {
      el.quizFeedbackBox.style.display = 'none';
    }
  },

  handleAnswerSelect(selectedBtn, q) {
    if (this.answered) return;
    this.answered = true;

    const isCorrect = selectedBtn.getAttribute('data-correct') === 'true';
    const selectedLabel = selectedBtn.getAttribute('data-opt');
    const el = this.elements;

    // Record user's answer
    this.userAnswers[this.currentIndex] = { isCorrect, selectedLabel };

    // Recalculate score from all answered questions
    this.score = Object.values(this.userAnswers).filter(a => a && a.isCorrect).length;

    // Disable all options and style selection
    const allBtns = el.quizOptionsList.querySelectorAll('.quiz-opt');
    allBtns.forEach(btn => {
      btn.disabled = true;
      if (!isCorrect && btn.getAttribute('data-correct') === 'true') {
        btn.classList.add('correct');
      }
    });
    selectedBtn.classList.add(isCorrect ? 'correct' : 'wrong');

    // Update score pill & Render feedback
    if (el.quizScoreText) el.quizScoreText.textContent = `${this.score} Doğru`;
    this.renderFeedback(isCorrect, q.target);

    // Show auto-advance indicator
    if (el.quizAutoIndicator) {
      el.quizAutoIndicator.style.display = 'flex';
    }

    // Automatically advance to the next question after 850ms
    this.autoNextTimeout = setTimeout(() => {
      this.nextQuestion();
    }, 850);
  },

  prevQuestion() {
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentQuestion();
    }
  },

  nextQuestion() {
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }
    this.currentIndex++;
    this.renderCurrentQuestion();
  },

  finishQuiz() {
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }
    if (this.timerInterval) clearInterval(this.timerInterval);

    const el = this.elements;
    const totalQ = this.currentQuestions.length;
    const wrong = totalQ - this.score;
    const accuracy = Math.round((this.score / totalQ) * 100);

    // Save score to Global State
    State.recordQuizResult(this.score, totalQ);
    if (window.App) window.App.updateHeaderStats();

    // Hide question card & Show results screen
    if (el.quizCardElement) el.quizCardElement.style.display = 'none';
    if (el.quizFeedbackBox) el.quizFeedbackBox.style.display = 'none';

    if (el.quizResultsScreen) {
      el.quizResultsScreen.style.display = 'block';
      const formatTitle = this.quizFormat === 'vocab' ? 'Sadece Kelime & Anlam Testi' : '5 Şıklı YDS Cümle Testi';
      const levelTitle = State.activeLevel === 'ALL' ? 'Tüm Seviyeler' : State.activeLevel;
      if (el.resultsSubtitle) el.resultsSubtitle.textContent = `${levelTitle} · ${formatTitle} Değerlendirmesi`;
      if (el.resTotalQ) el.resTotalQ.textContent = totalQ;
      if (el.resCorrect) el.resCorrect.textContent = this.score;
      if (el.resWrong) el.resWrong.textContent = wrong;
      if (el.resAccuracy) el.resAccuracy.textContent = `%${accuracy}`;
    }
  }
};

window.QuizModule = QuizModule;
