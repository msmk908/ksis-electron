import React from 'react';
import { NavLink } from 'react-router-dom';

// 로고 이미지 경로를 상대 경로로 가져오기
import ksisLogo from '../../assets/logo/ksis-logo.png';

const Sidebar: React.FC = () => {
  return (
    <div className="w-100 h-screen bg-orange-200 text-black p-4 fixed">
      <img src={ksisLogo} alt="KSIS Logo" className="w-24 mx-auto"></img>
      <h3 className="text-center mb-4 "> 백민규(msmk802)님 환영합니다.</h3>
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
