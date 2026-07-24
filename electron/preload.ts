import { contextBridge, ipcRenderer } from 'electron';
import type { Observation, PosteriorMap } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getCandidates: () => ipcRenderer.invoke('app:getCandidates'),
  startMatch: (opts: { opponentClass?: string }) => ipcRenderer.invoke('match:start', opts),
  resetMatch: () => ipcRenderer.invoke('match:reset'),
  addObservation: (obs: Observation) => ipcRenderer.invoke('obs:add', obs),
  quickInfer: () => ipcRenderer.invoke('infer:quick'),
  startImportance: (opts: { samples?: number }) => ipcRenderer.invoke('infer:importanceStart', opts),
  inferStatus: () => ipcRenderer.invoke('infer:status'),
  getPosterior: (): Promise<{ posterior: PosteriorMap }> => ipcRenderer.invoke('infer:getPosterior'),
  saveMatch: () => ipcRenderer.invoke('storage:saveMatch'),
  listMatches: () => ipcRenderer.invoke('storage:listMatches')
});
