const { Menu, MenuItem } = require('electron')
import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
let mMainWindow;

function createWindow() {
    // Create the browser window.
    mMainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            spellcheck: true
        }
    })
    mMainWindow.webContents.on('context-menu', (event, params) => {
        const menu = new Menu()
        // Add each spelling suggestion
        for (const suggestion of params.dictionarySuggestions) {
            menu.append(new MenuItem({
                label: suggestion,
                click: () => mMainWindow.webContents.replaceMisspelling(suggestion)
            }))
        }

        // Allow users to add the misspelled word to the dictionary
        if (params.misspelledWord) {
            menu.append(
                new MenuItem({
                    label: 'Add to dictionary',
                    click: () => mMainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                })
            )
        }

        menu.popup()
    })
    mMainWindow.on('ready-to-show', () => {
        mMainWindow.show()
    })

    mMainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        mMainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mMainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
    mMainWindow = mainWindow
    return mMainWindow;
}

function get() {
    console.log(mMainWindow);
    return mMainWindow;
}

export default { createWindow, get }