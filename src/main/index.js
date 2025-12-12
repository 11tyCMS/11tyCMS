import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import path from 'node:path';
import exopsedFunctions from '../functions';
import myWindow from './window';
import eleventyDb from './database/eleventyDb';
import siteFuncs, { getSiteConfig } from '../functions/site';
const { Sequelize, DataTypes } = require('sequelize');
const child_process = require('child_process')

const sequelize = new Sequelize('sqlite::memory:');
console.dbg = (...args)=>{
  console.log('%c 11tyCMS Debug ', 'background: black; color: violet; font-weight:800;', ...args);
}

let collectionWatcher = null;
let browserWindow = null;
let eleventyDB = eleventyDb.initDbInstance();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // app.whenReady().then(()=>{
  //   protocol.handle('eleventy', (request)=>{
  //     console.log("eleventy")
  //     return net.fetch('file://' + request.url.slice('eleventy://'.length))
  //   });
  // })

  // Register the protocol handler ONCE
  protocol.handle('eleventy', (request) => {
    const eleventyDir = siteFuncs._getSelectedEleventySiteDir();

    console.log(`%c[Eleventy Protocol] Fetching: %c${request.url}%c from 11ty directory: %c ${eleventyDir}`, "color:cyan; font-weight:bold;", "font-style:italic;", "color:cyan; font-weight:bold;")
    // Check if user has selected a directory
    if (!eleventyDir) {
      console.log("[Eleventy Protocol] No directory selected yet");
      return new Response('No directory selected', { status: 404 });
    }

    // Get the file path from the URL
    const relativePath = `${getSiteConfig().input}/${request.url.slice('eleventy://'.length)}`;
    const fullPath = path.join(eleventyDir, relativePath);

    console.log("[Eleventy Protocol] Serving file:", fullPath);

    // Security check - make sure file is within selected directory
    if (!fullPath.startsWith(eleventyDir)) {
      return new Response('Access denied', { status: 403 });
    }

    return net.fetch('file://' + fullPath);
  });
  
  for(const channelName in exopsedFunctions){
    ipcMain.handle(channelName, (handle, ...args)=>exopsedFunctions[channelName](...args));
  }
  // IPC test
  browserWindow = myWindow.createWindow();
  console.log('window created');
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    collectionWatcher.close()
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.