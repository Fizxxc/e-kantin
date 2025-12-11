// js/tts.js
export function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "id-ID";
  u.rate = 1;
  u.pitch = 1;
  speechSynthesis.speak(u);
}
