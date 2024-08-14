// src/App.tsx
import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
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
     <Routes>
      <Route path="/" element={<Mac />}/>
      <Route path="/login" element={<Login />}/>
     </Routes>

      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-4">
          <Routes>  
            <Route path="/upload" element={<UploadComponent />} />
            <Route
              path="/uploadProgress"
              element={<UploadProgressComponent />}
            />
          </Routes>
        </div>
      </div>
    
    </Router>
  );
}

export default App;
