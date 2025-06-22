const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;
let currentExportFormat = 'txt'; // Track selected format

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600, 
        height: 1200,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false
        },
        show: false // Don't show until ready
    });

    function buildAppMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Exportovat Logy...',
                        submenu: [
                            {
                                label: 'Poslední výpočet',
                                click: () => {
                                    mainWindow.webContents.send('export-logs', { scope: 'last' });
                                }
                            },
                            {
                                label: 'Všechny výpočty',
                                click: () => {
                                    mainWindow.webContents.send('export-logs', { scope: 'all' });
                                }
                            },
                            { type: 'separator' },
                            {
                                label: 'TXT',
                                type: 'radio',
                                checked: currentExportFormat === 'txt',
                                click: () => {
                                    currentExportFormat = 'txt';
                                    mainWindow.webContents.send('export-logs-format', { format: 'txt' });
                                    buildAppMenu(); // Rebuild menu to update checkmarks
                                }
                            },
                            {
                                label: 'CSV',
                                type: 'radio',
                                checked: currentExportFormat === 'csv',
                                click: () => {
                                    currentExportFormat = 'csv';
                                    mainWindow.webContents.send('export-logs-format', { format: 'csv' });
                                    buildAppMenu(); // Rebuild menu to update checkmarks
                                }
                            },
                            {
                                label: 'XLSX',
                                type: 'radio',
                                checked: currentExportFormat === 'xlsx',
                                click: () => {
                                    currentExportFormat = 'xlsx';
                                    mainWindow.webContents.send('export-logs-format', { format: 'xlsx' });
                                    buildAppMenu(); // Rebuild menu to update checkmarks
                                }
                            },
                        ]
                    },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Prohodit osy XY',
                        click: () => {
                            mainWindow.webContents.send('switch-axes');
                        }
                    },
                    { type: 'separator' },
                    { role: 'reload' },
                    { role: 'toggledevtools' }
                ]
            },
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    // Load the HTML file
    mainWindow.loadFile('poh-core.html');

    // Build menu
    buildAppMenu();

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});
