import * as Speech from 'expo-speech';

export const speakWord = (text: string, rate: number = 0.9) => {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate,
    });
  } catch (err) {
    console.warn('Speech error:', err);
  }
};

export const stopSpeech = () => {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
};
