// src/App.tsx
import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  MAC,
  LOGIN,
  UPLOAD,
  UPLOAD_PROGRESS,
} from '../constants/page_constant';
import UploadComponent from './UploadComponent';
import UploadProgressComponent from './UploadProgressComponent';
import Sidebar from './Sidebar'; // 사이드바 컴포넌트 import
import Login from './Login';
import Mac from './Mac';
import 'tailwindcss/tailwind.css'; // Tailwind CSS import
import fetcher from '../fetcher';
import { CHECK_TOKEN, ACCESS_LOG } from '../constants/api_constant';

function App() {
  const [isOpen, setIsOpen] = useState(true); // 사이드바 상태 관리

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // 사이드바 열리고 닫히는 상태를 반전시킴
  };

  return (
    <Router>
      {/* <EncodingComplete /> */}
      <RouteHandler isOpen={isOpen} toggleSidebar={toggleSidebar}  />
    </Router>
  );
}

const RouteHandler = ({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldHideSidebar =
    location.pathname === MAC || location.pathname === LOGIN;

  // 경로에 따라 카테고리 ENUM 값 매핑
  const getCategoryByPathname = (pathname: string): string | null => {
    switch (pathname) {
      case UPLOAD:
        return 'UPLOAD';
      case UPLOAD_PROGRESS:
        return 'UPLOAD_PROGRESS';
      default:
        return null; // 로그를 남기지 않을 경우 null 반환
    }
  };

  // 특정 라우트에 대한 액세스 로그 남기기
  useEffect(() => {
    const accountId = localStorage.getItem('accountId'); // 세션에서 accountId를 가져옴
    const category = getCategoryByPathname(location.pathname);

    if (accountId && category) {
      localStorage.setItem('currentRoute', location.pathname);
      fetcher.post(ACCESS_LOG, {
        accountId,
        category,
      });
    }
  }, [location.pathname]); // location.pathname이 바뀔 때마다 실행

  // CHECK_TOKEN은 최초에 앱이 열렸을 때만 실행
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      fetcher
        .post(CHECK_TOKEN) // 로그인 상태 확인
        .then((response) => {
          if (response.data.logout) {
            // 로그아웃 처리
            localStorage.removeItem('accessToken');
            localStorage.removeItem('authority');
            localStorage.removeItem('accountId');
            localStorage.removeItem('currentRoute');

            navigate(LOGIN);
          } else {
            const savedRoute = localStorage.getItem('currentRoute');
            navigate(savedRoute as string);
          }
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
        });
    } else {
      localStorage.removeItem('accessToken');
    }
  }, []);

  return (
    <div className="flex">
      {/* 사이드바를 조건부로 렌더링 */}
      {!shouldHideSidebar && <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />}
      <div className={`flex-1 transition-all duration-300 ${!shouldHideSidebar ? (isOpen ? 'ml-64' : 'ml-24') : ''}`}>
        <Routes>
          <Route path={MAC} element={<Mac />} />
          <Route path={LOGIN} element={<Login />} />
          <Route path={UPLOAD} element={<UploadComponent />} />
          <Route path={UPLOAD_PROGRESS} element={<UploadProgressComponent />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
