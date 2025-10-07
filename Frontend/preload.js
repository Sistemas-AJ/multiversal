const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Funciones principales
  importFile: () => ipcRenderer.invoke('import-file'),
  runModel: (params) => ipcRenderer.invoke('run-model', params),
  plot: (params) => ipcRenderer.invoke('plot', params),
  checkServer: () => ipcRenderer.invoke('check-server'),
  
  // Eventos del menú
  onMenuImportFile: (callback) => ipcRenderer.on('menu-import-file', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Información del sistema
  platform: process.platform,
  versions: process.versions
});