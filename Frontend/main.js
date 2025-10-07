const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;
let host = 'http://localhost:5000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'default',
    backgroundColor: '#f5f5f5'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú de aplicación
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Importar datos',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-import-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de Chambeador',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de Chambeador',
              message: 'Chambeador v1.0.0',
              detail: 'Aplicación para análisis multivariable\nDesarrollado por ALIXTER'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejo de importación de archivos
ipcMain.handle('import-file', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar archivo de datos',
      filters: [
        { name: 'Archivos de datos', extensions: ['csv', 'xls', 'xlsx'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Excel', extensions: ['xls', 'xlsx'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (canceled) return null;
    
    const filePath = filePaths[0];
    const fs = require('fs');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
<<<<<<< HEAD
    
  const res = await axios.post('http://localhost:8080/import', form, {
=======

    const res = await axios.post(`${host}/import`, form, {
>>>>>>> 65946ef8fb08c83589e4afa44fe48ab3e87fbca1
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    return res.data;
  } catch (error) {
    console.error('Error importing file:', error);
    
    // Mostrar diálogo de error
    dialog.showErrorBox('Error de importación', 
      `No se pudo importar el archivo:\n${error.message}\n\nAsegúrate de que el servidor backend esté ejecutándose.`);
    
    return { error: error.message };
  }
});

// Manejo de ejecución de modelos
ipcMain.handle('run-model', async (event, params) => {
  try {
<<<<<<< HEAD
  const res = await axios.post('http://localhost:8080/model', params, {
=======
    const res = await axios.post(`${host}/model`, params, {
>>>>>>> 65946ef8fb08c83589e4afa44fe48ab3e87fbca1
      timeout: 60000 // 60 segundos para análisis complejos
    });
    return res.data;
  } catch (error) {
    console.error('Error running model:', error);
    return { error: error.response?.data?.error || error.message };
  }
});

// Manejo de generación de gráficos
ipcMain.handle('plot', async (event, params) => {
  try {
<<<<<<< HEAD
  const res = await axios.post('http://localhost:8080/plot', params, {
=======
    const res = await axios.post(`${host}/plot`, params, {
>>>>>>> 65946ef8fb08c83589e4afa44fe48ab3e87fbca1
      timeout: 30000
    });
    return res.data;
  } catch (error) {
    console.error('Error generating plot:', error);
    return { error: error.response?.data?.error || error.message };
  }
});

// Verificar estado del servidor backend
ipcMain.handle('check-server', async () => {
  try {
<<<<<<< HEAD
  const res = await axios.get('http://localhost:8080/health', { timeout: 5000 });
=======
    const res = await axios.get(`${host}/health`, { timeout: 5000 });
>>>>>>> 65946ef8fb08c83589e4afa44fe48ab3e87fbca1
    return { status: 'connected', data: res.data };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
});
