import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const WebSocketComponent = () => {
  useEffect(() => {
    // SockJS 및 STOMP를 사용하여 WebSocket 연결 생성
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
      console.log('Connected: ' + frame);

      // 서버로부터 인코딩 상태 업데이트 수신
      stompClient.subscribe('/topic/encoding-status', function (message) {
        console.log('Received: ' + message.body);

        // 수신한 메시지를 일렉트론의 IPC를 통해 전달 (토스트 알림 구현)
        window.ipcRenderer.send('encoding-complete', message.body);
      });
    });

    // 컴포넌트가 unmount 될 때 WebSocket 연결 종료
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, []);

  return null;
};

export default WebSocketComponent;
