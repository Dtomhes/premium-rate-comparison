const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(app.getPath('userData'), 'cases');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Premium Rate Comparison',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#f9f9f9'
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Case management
ipcMain.handle('list-cases', () => {
  return fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
      return { filename: f, name: data.caseName, updatedAt: data.updatedAt };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
});

ipcMain.handle('save-case', (_, payload) => {
  const safe = payload.caseName.replace(/[^a-z0-9\s_-]/gi, '_').slice(0, 60);
  const filename = safe + '_' + Date.now() + '.json';
  const full = { ...payload, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(full, null, 2));
  return filename;
});

ipcMain.handle('load-case', (_, filename) => {
  return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
});

ipcMain.handle('delete-case', (_, filename) => {
  fs.unlinkSync(path.join(dataDir, filename));
  return true;
});

ipcMain.handle('overwrite-case', (_, { filename, payload }) => {
  const full = { ...payload, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(full, null, 2));
  return filename;
});

// PDF export
ipcMain.handle('export-pdf', async (_, { defaultName }) => {
  const win = BrowserWindow.getFocusedWindow();
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultName + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!filePath) return null;
  const data = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'Letter',
    landscape: true,
    margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
  });
  fs.writeFileSync(filePath, data);
  shell.openPath(filePath);
  return filePath;
});
