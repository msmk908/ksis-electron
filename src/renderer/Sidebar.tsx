import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';
import apiClient from '../apiClient';

const Sidebar: React.FC = () => {
  const [accountId, setAccountId] = useState('');

  // useEffect를 사용해 컴포넌트가 마운트될 때 로컬 스토리지에서 값을 가져오도록 함
  useEffect(() => {
    let eventSource = new EventSource('http://localhost:8080/events');
    const accountId = localStorage.getItem('accountId');
    
    console.log('User ID:', accountId);
    if (accountId) {
      setAccountId(accountId);
    }
    
    eventSource.addEventListener('logout', (event) => {
      alert("로그아웃 되었습니다.");
      // 로컬 스토리지에서 액세스 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authority');
      localStorage.removeItem('accountId');
      // 로그인 페이지로 리디렉션
      window.location.href = '/downloadApp';
      console.log('로그아웃 이벤트 수신:', event.data);
      // SSE 연결 종료
      eventSource.close();  // 로그아웃 후 SSE 연결 종료
    });

  }, []); // 빈 배열을 의존성으로 하여 컴포넌트가 처음 마운트될 때만 실행됨

  return (
    <div className="w-100 h-screen bg-orange-200 text-black p-4 fixed">
      <img src={ksisLogo} alt="KSIS Logo" className="w-24 mx-auto"></img>
      <h3 className="text-center mb-4 "> {accountId}님 환영합니다.</h3>
      <ul className="space-y-2">
        <li>
          <NavLink
            to="/upload"
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
            to="/uploadProgress"
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
            to="/"
            onClick={async () => {
              const accountId = localStorage.getItem('accountId');
              try {
                // 서버로 로그아웃 요청 전송
                await apiClient.delete(`/logout/${accountId}`);

                await apiClient.post('/access-log',{
                  accountId,
                  category: 'LOGOUT',
                })
                // 로그아웃 성공 시 로컬스토리지 토큰 제거
                localStorage.removeItem('accessToken');
                // localStorage.removeItem('refreshToken');
                localStorage.removeItem('accountId');
              } catch (error) {
                console.error("로그아웃 실패: ", error);
              }
            }}
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
