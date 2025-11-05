import { contextBridge, ipcRenderer, ipcMain} from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import exposedFunctions from '../functions';
window.ipcRenderer = require('electron').ipcRenderer;
let api = {}
for(const channelName in exposedFunctions){
  console.log('registering function', exposedFunctions[channelName].name, 'with channel', channelName)
  api[exposedFunctions[channelName].name] = (...args)=>ipcRenderer.invoke(channelName, ...args)
}
const registerApiFunction = (func, channelName)=>{
  api[func.name] = (...args)=>ipcRenderer.invoke(channelName, ...args)
  ipcMain.handle(channelName, func)
  contextBridge.exposeInMainWorld('api', api)
}
// Custom APIs for renderer

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

export {registerApiFunction};