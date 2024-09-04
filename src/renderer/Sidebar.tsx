import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';

const Sidebar: React.FC = () => {
  const [accountId, setAccountId] = useState('');

  // useEffect를 사용해 컴포넌트가 마운트될 때 로컬 스토리지에서 값을 가져오도록 함
  useEffect(() => {
    const accountId = localStorage.getItem('accountId');
    console.log('User ID:', accountId);
    if (accountId) {
      setAccountId(accountId);
    }
  }, []); // 빈 배열을 의존성으로 하여 컴포넌트가 처음 마운트될 때만 실행됨

  return (
    <div className="w-100 h-screen bg-orange-200 text-black p-4 fixed">
      <img src={ksisLogo} alt="KSIS Logo" className="w-24 mx-auto"></img>
      <h3 className="text-center mb-4 "> {accountId}님 환영합니다.</h3>
      <ul className="space-y-2">
        <li>
          <NavLink
            to="/"
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
            onClick={() => {
              //로그아웃 시 로컬스토리지 제거
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('accountId');
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
