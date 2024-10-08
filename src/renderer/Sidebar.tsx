import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';
import fetcher from '../fetcher';
import { EVENT, ACCESS_LOG, LOGOUT } from '../constants/api_constant';
import { UPLOAD, UPLOAD_PROGRESS, LOGIN  } from '../constants/page_constant';

const API_BASE_URL = window.env.API_BASE_URL; // API Base URL 가져오기
const SSE_URL = `${API_BASE_URL}${EVENT}`;

const Sidebar: React.FC = () => {
  const [accountId, setAccountId] = useState('');
  const navigate = useNavigate();

  // useEffect를 사용해 컴포넌트가 마운트될 때 로컬 스토리지에서 값을 가져오도록 함
  useEffect(() => {
    let eventSource = new EventSource(SSE_URL);
    const accountId = localStorage.getItem('accountId');
    console.log('User ID:', accountId);
    if (accountId) {
      setAccountId(accountId);
    }
    
    eventSource.addEventListener('logout', (event) => {
      const loggedOutAccountId = event.data;
      const currentAccountId = accountId;

      if (loggedOutAccountId === currentAccountId) {
        // 로컬 스토리지에서 액세스 토큰 제거
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authority");
        localStorage.removeItem("accountId");
        // 로그인 페이지로 리디렉션
        navigate(LOGIN);
        console.log("로그아웃 이벤트 수신:", event.data);
        // SSE 연결 종료
        eventSource.close(); // 로그아웃 후 SSE 연결 종료
      }
    });
  }, []); // 빈 배열을 의존성으로 하여 컴포넌트가 처음 마운트될 때만 실행됨

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
            onClick={async () => {
              const accountId = localStorage.getItem('accountId');
              try {
                // 서버로 로그아웃 요청 전송
                await fetcher.delete(`${LOGOUT}/${accountId}`);

                await fetcher.post(ACCESS_LOG, {
                  accountId,
                  category: 'LOGOUT',
                });
                // 로그아웃 성공 시 로컬스토리지 토큰 제거
                localStorage.removeItem('accessToken');
                localStorage.removeItem('accountId');
                localStorage.removeItem('currentRoute');
              } catch (error) {
                console.error('로그아웃 실패: ', error);
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
