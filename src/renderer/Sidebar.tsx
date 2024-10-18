import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { EventSourcePolyfill } from 'event-source-polyfill';
// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';
import fetcher from '../fetcher';
import { EVENT, ACCESS_LOG, LOGOUT } from '../constants/api_constant';
import { UPLOAD, UPLOAD_PROGRESS, LOGIN } from '../constants/page_constant';
const API_WS_URL = window.env.API_WS_URL;
const API_BASE_URL = window.env.API_BASE_URL; // API Base URL 가져오기

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const accountId = localStorage.getItem('accountId');
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (accessToken) {
      // 웹소켓 연결 생성

      const newWs = new WebSocket(API_WS_URL + '/ws/login');
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
      if (ws) {
        ws.send(JSON.stringify({ action: 'logout', token: accessToken }));
        ws.close;
      } else {
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

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 클릭한 요소가 사이드바 내부의 버튼 등이 아닌 빈 영역일 경우만 닫기
    if (isOpen && (e.target as HTMLElement).closest('ul') === null) {
      toggleSidebar();
    } else if (!isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div
      className={`fixed h-screen ${isOpen ? 'w-48' : 'w-8'} bg-gray-100 transition-width duration-300 p-4`}
      onClick={handleSidebarClick}
    >
      <div className="flex justify-between items-center">
        <img src={ksisLogo} alt="KSIS Logo" className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'} w-24`} />
      </div>
      {isOpen && (
        <>
          <h3 className="text-center mb-4">
            <span className="font-bold">{accountId}</span>님 환영합니다.
          </h3>
          <ul className="space-y-2">
            <li>
              <NavLink
                to={UPLOAD}
                className={({ isActive }) =>
                  `text-center block text-lg font-bold p-2 rounded-full ${
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
                  `text-center block text-lg font-bold p-2 rounded-full ${
                    isActive ? 'bg-orange-400 text-white' : 'hover:bg-orange-400'
                  }`
                }
              >
                업로드 진행상황
              </NavLink>
            </li>
            <li>
              <NavLink
                to={'/'}
                onClick={handleLogout}
                className={({ isActive }) =>
                  `text-center block text-lg font-bold p-2 rounded-full ${
                    isActive ? 'bg-orange-400 text-white' : 'hover:bg-orange-400'
                  }`
                }
              >
                로그아웃
              </NavLink>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;