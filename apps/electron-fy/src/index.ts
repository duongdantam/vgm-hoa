import { app, BrowserWindow, ipcMain, screen, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import * as url from 'url';
// import { create, CID, multiaddr } from 'ipfs-http-client'
// import { exec, spawn, execSync, spawnSync } from 'child_process'
let serve;
const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');

let win: Electron.BrowserWindow = null;
let menu: Electron.Menu;
const isMac = process.platform === 'darwin'
// let ipfsClient = create();
// const ipfsPeers = [
//   '/dns4/vn.gateway.vgm.tv/tcp/4001/ipfs/QmQjUXFjp9PnD4oyEHpj2ChJThtTjQjuQFVJiEs5BFqFrd',
//   '/dns4/sg.gateway.vgm.tv/tcp/4001/ipfs/QmdYMzmS4vcRjMHMbpmJiDXvs9p4ck289QsDHmVsNfLmL4',
//   '/dns4/vn-ntl.gateway.vgm.tv/tcp/4001/ipfs/QmZSnJJ1uj6pyMnXBwk7BxqtKWTWAKbU9wB6dtD7fGMb7e',
// ];
const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
const isEnvSet = 'ELECTRON_IS_DEV' in process.env;
const debugMode = isEnvSet
  ? getFromEnv
  : process.defaultApp ||
  /node_modules[\\/]electron[\\/]/.test(process.execPath);

/**
 * Electron window settings
 */
const mainWindowSettings: Electron.BrowserWindowConstructorOptions = {
  frame: true,
  resizable: true,
  focusable: true,
  fullscreenable: true,
  kiosk: false,
  // to hide title bar, uncomment:
  // titleBarStyle: 'hidden',
  webPreferences: {
    devTools: debugMode,
    nodeIntegration: debugMode,
  },
};

/**
 * Hooks for electron main process
 */
function initMainListener() {
  ipcMain.on('ELECTRON_BRIDGE_HOST', (event, msg) => {
    console.log('msg received', msg);
    if (msg === 'ping') {
      event.sender.send('ELECTRON_BRIDGE_CLIENT', 'pong');
    }
  });
}
/**
 * Create main window menu
 */
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
    {
      role: 'help',
      submenu: [{
        label: 'Learn More',
        click() {
          require('electron').shell.openExternal('https://vgm.tv');
        }
      }]
    }
  ];
  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
/**
 * Create main window presentation
 */
function createWindow() {
  const sizes = screen.getPrimaryDisplay().workAreaSize;
  mainWindowSettings.width = 1100;
  mainWindowSettings.height = 600;
  mainWindowSettings.x = (sizes.width - 1100) / 2;
  mainWindowSettings.y = (sizes.height - 600) / 2;
  if (debugMode) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  }
  win = new BrowserWindow(mainWindowSettings);

  let launchPath;
  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../../../node_modules/electron`),
    });
    launchPath = 'http://localhost:4200';
    win.loadURL(launchPath);
  } else {
    launchPath = url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    });
    win.loadURL(launchPath);
  }
  // // register macos cmd+Q shortcut for quitting
  // if (process.platform === 'darwin') {
  //   globalShortcut.register('Command+Q', () => {
  //     app.quit();
  //   })
  // }

  console.log('launched electron with:', launchPath);

  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  initMainListener();

  if (debugMode) {
    // Open the DevTools.
    win.webContents.openDevTools();
    // client.create(applicationRef);
  }
}

// function connectIPFS() {
//   // test ipfs installation
//   exec('ipfs --version', (error, stdout, stderr) => {
//     if (stdout) {
//       let cmd = 'ipfs bootstrap add'
//       if (ipfsPeers[0]) {
//         ipfsPeers.forEach((peer) => {
//           cmd = cmd + ' ' + peer;
//         })
//         spawn('ipfs', ['cmd']);
//       }
//       // test ipfs daemon
//       exec('ipfs swarm peers', async (error, stdout, stderr) => {
//         if (stdout) {
//           console.log('ipfs is online', stdout.toString());
//         } else {
//           spawn('ipfs', ['daemon']);
//         }
//       })
//     } else {
//       // script install ipfs
//       if (process.platform === 'win32') {
//         const home = execSync('cd ~ && pwd', { encoding: "utf8" });
//         const cmd = `cd ~ && wget https://dist.ipfs.io/go-ipfs/v0.9.1/go-ipfs_v0.9.1_windows-amd64.zip -Outfile go-ipfs_v0.9.1.zip &&
//         Expand-Archive -Path go-ipfs_v0.9.1.zip -DestinationPath ~\\Apps\\go-ipfs_v0.9.1 &&
//         Add-Content ${home}\\Documents\\WindowsPowerShell\\profile.ps1 "[System.Environment]::SetEnvironmentVariable('PATH',\`$Env:PATH+';;${home}\\Apps\\go-ipfs_v0.9.1\\go-ipfs')" &&
//         ipfs init &&
//         ipfs daemon`
//         console.log(cmd);
//         spawn('sh', ['-c', cmd]);
//       } else if (process.platform === 'darwin') {
//         const cmd = `wget https://dist.ipfs.io/go-ipfs/v0.9.1/go-ipfs_v0.9.1_darwin-amd64.tar.gz &&
//         tar -xvzf go-ipfs_v0.9.1_darwin-amd64.tar.gz &&
//         cd go-ipfs &&
//         bash install.sh &&
//         ipfs init &&
//         ipfs daemon`
//         console.log(cmd);
//         spawn('sh', ['-c', cmd]);
//       }
//       // else if (process.platform === 'linux') {
//       //   const cmd = `wget https://dist.ipfs.io/go-ipfs/v0.9.1/go-ipfs_v0.9.1_linux-amd64.tar.gz && \\
//       //   tar -xvzf go-ipfs_v0.9.1_linux-amd64.tar.gz && \\
//       //   cd go-ipfs && \\
//       //   sudo bash install.sh && \\
//       //   ipfs daemon`
//       //   spawn('sh', ['-c', cmd]);
//       // }
//     }

//   })
// }


try {
  app.on('ready', () => {
    createWindow();
    createMenu();
    // connectIPFS();
    // Get all service workers.
    // console.log(session.defaultSession.serviceWorkers.getAllRunning())

    // // Handle logs and get service worker info
    // session.defaultSession.serviceWorkers.on('console-message', (event, messageDetails) => {
    //   console.log(
    //     'Got service worker message',
    //     messageDetails,
    //     'from',
    //     session.defaultSession.serviceWorkers.getFromVersionID(messageDetails.versionId)
    //   )
    // })
  });

  // ipcMain.on('ipfs-pin', async (event, file: string) => {
  //   if (ipfsClient) {
  //     await ipfsClient.pin.add(CID.parse(file));
  //   }
  // });

  app.on('window-all-closed', quit);

  ipcMain.on('quit', quit);

  ipcMain.on('minimize', () => {
    win.minimize();
  });

  ipcMain.on('maximize', () => {
    win.maximize();
  });

  ipcMain.on('restore', () => {
    win.restore();
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (err) { }

function quit() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}
