import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { EventSourcePolyfill } from 'event-source-polyfill';
// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';
import fetcher from '../fetcher';
import { EVENT, ACCESS_LOG, LOGOUT } from '../constants/api_constant';
import { UPLOAD, UPLOAD_PROGRESS, LOGIN  } from '../constants/page_constant';
const API_WS_URL = window.env.API_WS_URL;
const API_BASE_URL = window.env.API_BASE_URL; // API Base URL 가져오기
const SSE_URL = `${API_BASE_URL}${EVENT}`;

const Sidebar: React.FC = () => {
  const accountId = localStorage.getItem("accountId");
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("accessToken");

  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (accessToken) {
      // 웹소켓 연결 생성
    
      const newWs = new WebSocket(API_WS_URL+'/ws/login');
      setWs(newWs);

      newWs.onopen = () => {
        console.log('WebSocket connection opened');
        newWs.send(JSON.stringify({ action: 'register', token: accessToken }));
      };

      newWs.onclose = () => {
        console.log('WebSocket connection closed');
      };

      newWs.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      newWs.onmessage = (event) => {  
        console.log('Received message:', event);
        const message = JSON.parse(event.data);
        console.log('Parsed message:', message);

        if (message.action === 'logout') {
          console.log('Logout action received via WebSocket');
          localStorage.removeItem('accessToken');
          newWs.close(); 
          navigate(LOGIN); 
        }
      };
    }
  }, []); 

  const handleLogout = async () => {
    const accountId = localStorage.getItem('accountId');
    try {
      // 서버로 로그아웃 요청 전송
      await fetcher.delete(`${LOGOUT}/${accountId}`);

      await fetcher.post(ACCESS_LOG, {
        accountId,
        category: 'LOGOUT',
      });
      if(ws){
      ws.send(JSON.stringify({ action: 'logout', token: accessToken }));
      ws.close
      }else{
        console.log('WebSocket is not connected');
      }
      // 로그아웃 성공 시 로컬스토리지 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('accountId');
      localStorage.removeItem('currentRoute');

      // 로그인 페이지로 이동
      navigate(LOGIN);
    } catch (error) {
      console.error('로그아웃 실패: ', error);
    }
  };

  return (
    <div className="w-100 h-screen bg-orange-200 text-black p-4 fixed">
      <img src={ksisLogo} alt="KSIS Logo" className="w-24 mx-auto"></img>
      <h3 className="text-center mb-4 "> {accountId}님 환영합니다.</h3>
      <ul className="space-y-2">
        <li>
          <NavLink
            to={UPLOAD}
            className={({ isActive }) =>
              `text-center block text-lg p-2 rounded-full ${
                isActive ? 'bg-orange-400 text-white' : 'hover:bg-orange-400'
              }`
            }
          >
            파일 업로드
          </NavLink>
        </li>
        <li>
          <NavLink
            to={UPLOAD_PROGRESS}
            className={({ isActive }) =>
              `text-center block text-lg p-2 rounded-full ${
                isActive ? 'bg-orange-400 text-white' : 'hover:bg-orange-400'
              }`
            }
          >
            업로드 진행상황
          </NavLink>
        </li>
        <li>
          <NavLink
            to={"/"}
            onClick={handleLogout}
            className={({ isActive }) =>
              `text-center block text-lg p-2 rounded-full ${
                isActive ? 'bg-orange-400 text-white' : 'hover:bg-orange-400'
              }`
            }
          >
            로그아웃
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
