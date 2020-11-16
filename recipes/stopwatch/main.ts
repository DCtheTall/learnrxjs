import {BrowserWindow, app} from 'electron';

function createWindow() {
    const window = new BrowserWindow({width: 600, height: 600});
    window.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
