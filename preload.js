const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listCases: () => ipcRenderer.invoke('list-cases'),
  saveCase: (payload) => ipcRenderer.invoke('save-case', payload),
  loadCase: (filename) => ipcRenderer.invoke('load-case', filename),
  deleteCase: (filename) => ipcRenderer.invoke('delete-case', filename),
  overwriteCase: (filename, payload) => ipcRenderer.invoke('overwrite-case', { filename, payload }),
  exportPdf: (defaultName) => ipcRenderer.invoke('export-pdf', { defaultName })
});
