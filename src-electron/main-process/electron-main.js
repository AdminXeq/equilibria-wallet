import { app, ipcMain, BrowserWindow, Menu, dialog } from "electron"
import { Backend } from "./modules/backend"
import { checkForUpdate } from "./auto-updater"
import menuTemplate from "./menu"
import isDev from "electron-is-dev"
const portscanner = require("portscanner")
const windowStateKeeper = require("electron-window-state")
const fs = require("fs")
const path = require("upath")

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
    global.__statics = path.join(__dirname, "statics").replace(/\\/g, "\\\\")
    global.__ryo_bin = path.join(__dirname, "..", "bin").replace(/\\/g, "\\\\")
} else {
    global.__ryo_bin = path.join(process.cwd(), "bin").replace(/\\/g, "\\\\")
}

let mainWindow, backend
let showConfirmClose = true
let forceQuit = false
let installUpdate = false

const portInUse = function (port, callback) {
    var server = net.createServer(function (socket) {
        socket.write("Echo server\r\n")
        socket.pipe(socket)
    })

    server.listen(port, "127.0.0.1")
    server.on("error", function (e) {
        callback(true)
    })
    server.on("listening", function (e) {
        server.close()
        callback(false)
    })
}

function createWindow () {
    /**
     * Initial window options
     */

    let mainWindowState = windowStateKeeper({
        defaultWidth: 900,
        defaultHeight: 700
    })

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 640,
        minHeight: 480,
        icon: require("path").join(__statics, "icon_512x512.png"),
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
    })

    mainWindow.on("close", (e) => {
      if(installUpdate) { return }
        if (process.platform === "darwin") {
            if (forceQuit) {
                forceQuit = false
                if (showConfirmClose) {
                    e.preventDefault()
                    mainWindow.show()
                    mainWindow.webContents.send("confirmClose")
                } else {
                    e.defaultPrevented = false
                }
            } else {
                e.preventDefault()
                mainWindow.hide()
            }
        } else {
            if (showConfirmClose) {
                e.preventDefault()
                mainWindow.webContents.send("confirmClose")
            } else {
                e.defaultPrevented = false
            }
        }
    })

    ipcMain.on("confirmClose", (e, restart) => {
        showConfirmClose = false

        // In dev mode, this will launch a blank white screen
        if (restart && !isDev) app.relaunch()

        const promise = backend ? backend.quit() : Promise.resolve()
         promise.then(() => {
             backend = null
             app.quit()
        })
    })

    mainWindow.webContents.on("did-finish-load", () => {
        require("crypto").randomBytes(64, (err, buffer) => {
            // if err, then we may have to use insecure token generation perhaps
            if (err) throw err

            let port = (Math.floor(Math.random() * 6) + 1).toString() + Math.floor(Math.random() * (5 + 1)).toString() + Math.floor(Math.random() * (5 + 1)).toString() + Math.floor(Math.random() * (3 + 1)).toString() + Math.floor(Math.random() * (5 + 1)).toString()
            let config = {
                port: port,
                token: buffer.toString("hex")
            }

            portscanner.checkPortStatus(config.port, "127.0.0.1", (error, status) => {
                if (status === "closed") {
                    backend = new Backend(mainWindow)
                    backend.init(config)
                    mainWindow.webContents.send("initialize", config)
                } else {
                    dialog.showMessageBox(mainWindow, {
                        title: "Startup error",
                        message: `Equilibria Wallet is already open, or port ${config.port} is in use`,
                        type: "error",
                        buttons: ["ok"]
                    }, () => {
                        showConfirmClose = false
                        app.quit()
                    })
                }
            })
        })
    })

    mainWindow.loadURL(process.env.APP_URL)
    mainWindowState.manage(mainWindow)
}

app.on("ready", () => {

  checkForUpdate(autoUpdater => {
           if (mainWindow) {
               mainWindow.webContents.send("showQuitScreen")
           }

           const promise = backend ? backend.quit() : Promise.resolve()
           promise.then(() => {
               installUpdate = true
               backend = null
               autoUpdater.quitAndInstall()
           })
       })

    if (process.platform === "darwin") {
        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)
    }
    createWindow()
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow()
    } else if (process.platform === "darwin") {
        mainWindow.show()
    }
})

app.on("before-quit", async () => {

   if (installUpdate) {
         return
     }

    try {
        if (process.platform === "darwin") {
            forceQuit = true
        } else {
            if (backend) {
                await backend.quit()
                backend = null
                console.log('electron before-quit then>>>>>>>>>>')
            }
        }
    } catch (error) {
        console.log('electron before-quit exception', error)
    }
})

app.on("quit", async () => {
    console.log('electron quit close>>>>>>>>>>')
})
