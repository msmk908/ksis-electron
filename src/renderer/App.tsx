// src/App.tsx
import React from 'react';
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
import icon from '../../assets/icon.svg';
import UploadComponent from './UploadComponent';
import UploadProgressComponent from './UploadProgressComponent';
import Sidebar from './Sidebar'; // 사이드바 컴포넌트 import
import Login from './Login';
import Mac from './Mac';
import EncodingComplete from './EncodingComplete';
import 'tailwindcss/tailwind.css'; // Tailwind CSS import
import fetcher from '../fetcher';
import { CHECK_TOKEN, ACCESS_LOG } from '../constants/api_constant';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      {/* <EncodingComplete /> */}
      <RouteHandler />
    </Router>
  );
}

const RouteHandler = () => {
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
            console.log('로그아웃');
          } else {
            const savedRoute = localStorage.getItem('currentRoute');
            navigate(savedRoute as string);
            console.log('로그인 유지');
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
      {!shouldHideSidebar && <Sidebar />}
      <div className={`flex-1 ${!shouldHideSidebar ? 'ml-64' : ''}`}>
        <Routes>
          <Route path={MAC} element={<Mac />} />
          <Route path={LOGIN} element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path={UPLOAD} element={<UploadComponent />} />
            <Route
              path={UPLOAD_PROGRESS}
              element={<UploadProgressComponent />}
            />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default App;
