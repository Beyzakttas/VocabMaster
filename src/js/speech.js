// speech.js - Web Speech API Voice Pronunciation
const SpeechService = {
  synth: window.speechSynthesis,
  preferredVoice: null,

  init() {
    if (!this.synth) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    // Load available voices
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.selectBestEnglishVoice();
    }
    this.selectBestEnglishVoice();
  },

  selectBestEnglishVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural UK / US English voices
    this.preferredVoice = voices.find(v => (v.lang === 'en-GB' || v.lang === 'en-US') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) 
      || voices.find(v => v.lang.startsWith('en')) 
      || null;
  },

  speak(text) {
    if (!this.synth) return;
    // Cancel any previous speech
    this.synth.cancel();

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear academic pronunciation
    utterance.pitch = 1.0;

    this.synth.speak(utterance);
  }
};

window.SpeechService = SpeechService;
