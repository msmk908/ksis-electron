import os from 'node:os';
import path from 'path';
import fs from 'fs'; // fs 모듈 추가
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Tray,
  Menu,
  Notification,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
// import getLocalIP from '../renderer/getLocalIP';
import 'dotenv/config';

const platform = os.platform(); // 현재 플랫폼

// 일랙트론 아이콘 경로
const getIconPath = () => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.png')
    : path.join(__dirname, '../../assets/icon.png');

  console.log('Icon Path: ', iconPath); // 경로를 콘솔에 출력
  return iconPath;
};

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
// 트레이
let tray: Tray | null = null;
let isQuiting = false; // 앱 종료 여부를 추적하는 플래그

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

// 트레이 생성
const createTray = () => {
  if (!tray) {
    const iconPath = getIconPath();

    tray = new Tray(iconPath);
    tray.setToolTip('ksis-electron');
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    });

    tray.on('right-click', () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
            }
          },
        },
        {
          label: 'Quit',
          click: () => {
            isQuiting = true;
            app.quit();
          },
        },
      ]);
      tray?.popUpContextMenu(contextMenu);
    });
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  // 패키징 상태에서도 개발자 도구를 열도록 설정
  mainWindow.webContents.on('did-frame-finish-load', () => {
    if (!isDebug) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' }); // 개발자 도구 분리 모드로 열기
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

// 파일을 가져오는 ipc통신
ipcMain.handle('get-file', async (event, filePath) => {
  try {
    // 파일 데이터를 읽어옴
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer; // 파일 데이터를 반환
  } catch (error) {
    console.error('파일을 읽는 중 오류 발생:', error);
    throw error;
  }
});
// ipcMain.handle('get-ip-address', () => getLocalIP());
ipcMain.handle('get-mac-address', () => {
  const networkInterfaces = os.networkInterfaces();
  const macAddresses: string[] = [];

  for (const key in networkInterfaces) {
    if (networkInterfaces.hasOwnProperty(key)) {
      const addresses = networkInterfaces[key];

      // addresses가 undefined가 아닐 때만 처리
      if (addresses) {
        addresses.forEach((address) => {
          if (address.mac && address.mac !== '00:00:00:00:00:00') {
            macAddresses.push(address.mac);
          }
        });
      }
    }
  }

  return macAddresses[0] || null; // 첫 번째 MAC 주소를 반환하거나 없으면 null
});

ipcMain.handle('open-url', (event, url) => {
  shell.openExternal(url);
});

// 원본 업로드 토스트 알림 통신
ipcMain.handle('upload-complete', (event, fileTitle) => {
  const icon = getIconPath();
  const notification = new Notification({
    title: '업로드 완료',
    body: `${fileTitle} 파일이 성공적으로 업로드되었습니다`,
    icon: icon,
  });

  notification.show();
});

// 인코딩 업로드 토스트 알림 통신
ipcMain.handle('encoding-complete', (event, fileTitle) => {
  const icon = getIconPath();
  const notification = new Notification({
    title: '인코딩 완료',
    body: `${fileTitle} 인코딩이 성공적으로 완료되었습니다`,
    icon: icon,
  });

  notification.show();
});

/**
 * Add event listeners...
 */

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const url = commandLine.find((cmd) => cmd.startsWith('ksis://'));
    if (url) {
      mainWindow.webContents.send('open-url', url);
    }
  }
});

app.on('open-url', (event, url) => {
  if (mainWindow) {
    mainWindow.webContents.send('open-url', url);
  } else {
    app.once('ready', () => {
      createWindow();
      createTray(); // 트레이 생성
      app.whenReady().then(() => {
        if (mainWindow === null) {
          createWindow();
          createTray(); // 트레이 생성 추가
        }
      });
    });
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    createTray(); // 트레이 생성
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
