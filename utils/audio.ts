// src/utils/audio.ts

// A cheerful 'pop' notification sound in Base64 to avoid external asset dependency
export const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // (Shortened for brevity, full code below acts as placeholder, ideally use a real file or url)

// For better experience, let's use a reliable hosted sound or a proper short base64
// This is a short 'ding' sound
export const PLAY_NOTIFICATION = () => {
  try {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.warn("Audio play blocked by browser policy", e));
  } catch (e) {
    console.error("Audio error", e);
  }
};