import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
window.ipcRenderer = require('electron').ipcRenderer;
// Custom APIs for renderer
const api = {
  openDirectory: ()=>ipcRenderer.invoke('dialog:openDir'),
  openFile: (fileName)=>ipcRenderer.invoke('dialog:openFile', fileName),
  saveFile: (path, metadata, contents)=>ipcRenderer.invoke('file:save', path, metadata, contents),
  renameFile: (beforePath, afterPath)=>ipcRenderer.invoke('file:rename', beforePath, afterPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('ipcRenderer', {
      ...ipcRenderer,
      removeAllListeners: (channel)=>ipcRenderer.removeAllListeners(channel),
      on: (channel, callback) => ipcRenderer.on(channel, callback)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

