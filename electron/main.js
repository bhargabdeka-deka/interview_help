const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Always use dev URL or production backend URL
const isDev = !!process.env.ELECTRON_START_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Handle camera and microphone permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'midi', 'midiSysex', 'pointerLock', 'fullscreen', 'openExternal'];
    
    if (allowedPermissions.includes(permission)) {
      callback(true); // Approve
    } else {
      console.error('Permission request denied:', permission);
      callback(false); // Deny
    }
  });

  // Handle specific media access requests
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media') {
      return true;
    }
    return true;
  });

  if (isDev && process.env.ELECTRON_START_URL) {
    const devUrl = process.env.ELECTRON_START_URL;
    console.log('Loading dev URL:', devUrl);
    win.loadURL(devUrl).catch(err => console.error('Failed to load dev URL', err));
    win.webContents.openDevTools();
  } else {
    // For production, use a backend URL (must be running on production)
    const prodUrl = process.env.ELECTRON_BACKEND_URL || 'http://localhost:3000';
    console.log('Loading production URL:', prodUrl);
    win.loadURL(prodUrl).catch(err => {
      console.error('Failed to load URL:', err);
      win.loadURL(`data:text/html,<h1>App failed to load</h1><pre>${err.message}</pre>`);
      win.webContents.openDevTools();
    });
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load', errorCode, errorDescription, validatedURL);
    win.webContents.openDevTools();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
