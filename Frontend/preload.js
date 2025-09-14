const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  importFile: () => ipcRenderer.invoke('import-file'),
  runModel: (params) => ipcRenderer.invoke('run-model', params),
  plot: (params) => ipcRenderer.invoke('plot', params)
});