const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onExportLogs: (callback) => ipcRenderer.on('export-logs', (e, args) => callback(args)),
  onExportLogsFormat: (callback) => ipcRenderer.on('export-logs-format', (e, args) => callback(args)),
  onSwitchAxes: (callback) => ipcRenderer.on('switch-axes', () => callback())
});
