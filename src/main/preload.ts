// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
export type Channels =
  | 'ipc-example'
  | 'get-file'
  | 'upload-complete'
  | 'encoding-complete';

const electronHandler = {
  ipcRenderer: {
    // 메세지를 보내는 함수
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },

    // 메세지를 수신하는 함수 (리스너 등록)
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },

    // 메세지를 한 번만 수신하는 함수
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },

    // IPC 요청을 보내고 응답을 받는 함수 (비동기)
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },

  getMacAddress() {
    return ipcRenderer.invoke('get-mac-address');
  },

  // getIpAddress() {
  //   return ipcRenderer.invoke('get-ip-address');
  // },

  // 파일을 가져오는 함수 추가
  getFile(filePath: string) {
    return ipcRenderer.invoke('get-file', filePath);
  },

  // 업로드 토스트 알림
  uploadComplete(fileTitle: string) {
    return ipcRenderer.invoke('upload-complete', fileTitle);
  },

  // 인코딩 토스트 알림
  encodingComplete(fileTitle: string) {
    return ipcRenderer.invoke('encoding-complete', fileTitle);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const webBaseUrl = process.env.REACT_APP_WEB_BASE_URL;
const webSocketUrl = process.env.REACT_APP_API_WS_URL;
console.log('apiBaseUrl : ', apiBaseUrl);
console.log('webBaseUrl : ', webBaseUrl);
console.log('socketBaseUrl : ', webSocketUrl);

contextBridge.exposeInMainWorld('env', {
  // API_BASE_URL: apiBaseUrl || 'http://localhost:8080',
  // WEB_BASE_URL: webBaseUrl || 'http://localhost:3000',
  // API_BASE_URL: apiBaseUrl || 'http://133.186.214.102/api',
  // WEB_BASE_URL: webBaseUrl || 'http://133.186.214.102',

  API_BASE_URL: apiBaseUrl || 'https://www.ksisdisplay.com/api',
  WEB_BASE_URL: webBaseUrl || 'https://www.ksisdisplay.com',
  API_WS_URL: webSocketUrl || 'wss://www.ksisdisplay.com/api',
});

export type ElectronHandler = typeof electronHandler;
