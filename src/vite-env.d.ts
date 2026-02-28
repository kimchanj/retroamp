/// <reference types="vite/client" />

declare global {
  interface Window {
    retroamp: {
      openAudioFiles: () => Promise<string[]>;
    };
  }
}
export {};