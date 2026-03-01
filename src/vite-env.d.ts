/// <reference types="vite/client" />

declare global {
  interface Window {
    ipcRenderer?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
    retroamp?: {
      openAudioFiles: () => Promise<string[]>;
      minimizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<boolean>;
      setPlaylistCollapsed: (collapsed: boolean) => Promise<boolean>;
      hideWindow: () => Promise<boolean>;
    };
  }
}
export {};
