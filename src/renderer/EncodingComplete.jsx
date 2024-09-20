import React, { useEffect } from 'react';

const useSSE = (url) => {
  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      // SSE에서 수신한 메시지를 Electron의 IPC로 전달
      window.electron.encodingComplete(event.data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [url]);
};

const EncodingStatus = () => {
  const API_BASE_URL = window.env.API_BASE_URL;

  useSSE(API_BASE_URL + '/sse/events');

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
};

export default EncodingStatus;
