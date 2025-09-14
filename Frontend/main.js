const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('import-file', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [
      { name: 'Datos', extensions: ['csv', 'xls', 'xlsx'] }
    ],
    properties: ['openFile']
  });
  if (canceled) return null;
  const filePath = filePaths[0];
  const fs = require('fs');
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const res = await axios.post('http://localhost:5000/import', form, {
    headers: form.getHeaders()
  });
  return res.data;
});

ipcMain.handle('run-model', async (event, params) => {
  const res = await axios.post('http://localhost:5000/model', params);
  return res.data;
});

ipcMain.handle('plot', async (event, params) => {
  const res = await axios.post('http://localhost:5000/plot', params);
  return res.data;
});
