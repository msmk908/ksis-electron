import React from 'react';
import { useLocation } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

function UploadProgressComponent() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">파일 업로드 진행 상황</h1>
    </div>
  );
}

export default UploadProgressComponent;
