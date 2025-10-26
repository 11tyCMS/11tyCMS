import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
window.ipcRenderer = require('electron').ipcRenderer;
// Custom APIs for renderer
const api = {
  openDirectory: ()=>ipcRenderer.invoke('dialog:openDir'),
  openFile: (fileName)=>ipcRenderer.invoke('dialog:openFile', fileName),
  saveFile: (path, metadata, contents)=>ipcRenderer.invoke('file:save', path, metadata, contents),
  saveFileMetadata: (path, metadata)=>ipcRenderer.invoke('file:saveMetadata', path, metadata),
  deleteFile: (path)=>ipcRenderer.invoke('file:delete', path),
  createCollection: (sitePath, name, layout)=>ipcRenderer.invoke('collection:create', sitePath, name, layout),
  // deleteCollection: (name)=>ipcRenderer.invoke('collection:delete', name),
  // editCollection: (name)=>ipcRenderer.invoke('collection:edit', name),
  saveImage: (path, file)=>ipcRenderer.invoke('file:saveImage', path, file),
  renameFile: (beforePath, afterPath)=>ipcRenderer.invoke('file:rename', beforePath, afterPath),
  getSiteInfo: (path)=>ipcRenderer.invoke('site:getSiteInfo', path),
  build: (path)=>ipcRenderer.invoke('site:build', path, path),
  publish: (path)=>ipcRenderer.invoke('site:publish', path),
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

