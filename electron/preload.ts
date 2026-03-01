import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...cbArgs) => listener(event, ...cbArgs));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

contextBridge.exposeInMainWorld('retroamp', {
  openAudioFiles: async (): Promise<string[]> => {
    const files = await ipcRenderer.invoke('retroamp:open-audio-files');
    return Array.isArray(files) ? files : [];
  },
  minimizeWindow: async () => {
    const result = await ipcRenderer.invoke('retroamp:window-minimize');
    return Boolean(result);
  },
  closeWindow: async () => {
    const result = await ipcRenderer.invoke('retroamp:window-close');
    return Boolean(result);
  },
  setPlaylistCollapsed: async (collapsed: boolean) => {
    const result = await ipcRenderer.invoke('retroamp:window-set-playlist-collapsed', collapsed);
    return Boolean(result);
  },
  hideWindow: async () => {
    const result = await ipcRenderer.invoke('retroamp:window-hide');
    return Boolean(result);
  },
});
