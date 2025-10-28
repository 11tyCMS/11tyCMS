import { contextBridge, ipcRenderer, ipcMain} from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import testing from '../functions';
window.ipcRenderer = require('electron').ipcRenderer;
console.log("omg hi preload", testing);
let api = {
  // deleteCollection: (name)=>ipcRenderer.invoke('collection:delete', name),
  // editCollection: (name)=>ipcRenderer.invoke('collection:edit', name),
}
for(const channelName in testing){
  console.log('registering function', testing[channelName].name, 'with channel', channelName)
  api[testing[channelName].name] = (...args)=>ipcRenderer.invoke(channelName, ...args)
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