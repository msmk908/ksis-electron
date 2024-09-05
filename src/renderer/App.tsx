// src/App.tsx
import React from 'react';
import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import icon from '../../assets/icon.svg';
import UploadComponent from './UploadComponent';
import UploadProgressComponent from './UploadProgressComponent';
import Sidebar from './Sidebar'; // 사이드바 컴포넌트 import
import Login from './Login';
import Mac from './Mac';
import 'tailwindcss/tailwind.css'; // Tailwind CSS import
import apiClient from '../apiClient';

function App() {
  return (
    <Router>
      <RouteHandler />
    </Router>
  );
}

const RouteHandler = () => {
  const location = useLocation();
  const shouldHideSidebar =
    location.pathname === '/' || location.pathname === '/login';

    // 경로에 따라 카테고리 ENUM 값 매핑
  const getCategoryByPathname = (pathname: string): string | null => {
    switch (pathname) {
      case '/upload':
        return 'UPLOAD';
      case '/uploadProgress':
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
      apiClient.post('/access-log', {
        accountId,
        category, 
      });
    }
  }, [location.pathname]);

  return (
    <div className="flex">
      {/* 사이드바를 조건부로 렌더링 */}
      {!shouldHideSidebar && <Sidebar />}
      <div className={`flex-1 ${!shouldHideSidebar ? 'ml-64' : ''} p-4`}>
        <Routes>
          <Route path="/" element={<Mac />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<UploadComponent />} />
          <Route path="/uploadProgress" element={<UploadProgressComponent />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
