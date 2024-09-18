const path = require('path');
const { app, BrowserWindow } = require('electron');
const config = require('./renderer/config');
const sql = require('mssql/msnodesqlv8');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Orders DB App',
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

app.whenReady().then(() => {
    createMainWindow();
});

app.on('window-all-closed', () => {
    app.quit();
})