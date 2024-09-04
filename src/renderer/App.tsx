// src/App.tsx
import React from 'react';
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
