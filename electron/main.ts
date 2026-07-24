import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { initializeStorage } from './api/storage';
import { CardDB } from './api/cardDB';
import { ObservationManager } from './api/observationManager';
import { InferenceEngine } from './api/inferenceEngine';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Initialize modules
const db = initializeStorage(path.join(app.getPath('userData'), 'app.db'));
const cardDB = new CardDB(); // loads sample legendary set
const obsMgr = new ObservationManager();
const infer = new InferenceEngine(cardDB, obsMgr);

// IPC handlers exposed via preload
ipcMain.handle('app:getCandidates', async () => {
  return { candidates: cardDB.getLegendaries(), settings: infer.getSettings() };
});

ipcMain.handle('match:start', async (_event, payload) => {
  obsMgr.startMatch(payload.opponentClass || 'NEUTRAL');
  return { ok: true };
});

ipcMain.handle('match:reset', async () => {
  obsMgr.resetMatch();
  infer.reset();
  return { ok: true };
});

ipcMain.handle('obs:add', async (_event, obs) => {
  obsMgr.addObservation(obs);
  // update quick posterior
  const quick = infer.estimateIndependent();
  return { ok: true, quick };
});

ipcMain.handle('infer:quick', async () => {
  return infer.estimateIndependent();
});

ipcMain.handle('infer:importanceStart', async (_event, options) => {
  // options: {samples:number}
  infer.startImportanceSampling(options?.samples || 5000);
  return { ok: true };
});

ipcMain.handle('infer:status', async () => {
  return infer.getStatus();
});

ipcMain.handle('infer:getPosterior', async () => {
  return infer.getPosterior();
});

ipcMain.handle('storage:saveMatch', async () => {
  const match = obsMgr.exportCurrentMatch();
  db.saveMatch(match);
  return { ok: true };
});

ipcMain.handle('storage:listMatches', async () => {
  return db.listMatches();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
