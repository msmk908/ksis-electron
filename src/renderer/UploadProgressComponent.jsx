import React from 'react';
import { useLocation } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

function UploadProgressComponent() {
  const location = useLocation();
  const { uploadStatus, filesProgress } = location.state || {};

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">파일 업로드 진행 상황</h1>
      <div className="flex flex-col space-y-4">
        {filesProgress &&
          filesProgress.map((fileProgress, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 border p-4 rounded-md shadow-sm"
            >
              <div className="w-1/4">
                {fileProgress.fileType.startsWith('image/') ? (
                  <img
                    src={fileProgress.fileUrl}
                    alt={`파일 미리보기 ${index}`}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <p>미리보기 없음</p>
                )}
              </div>
              <div className="w-3/4">
                <p className="text-lg font-semibold mb-2">
                  {fileProgress.fileName}
                </p>
                <div className="relative h-6 bg-gray-200 rounded-md overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500"
                    style={{ width: `${fileProgress.progress}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                    {fileProgress.progress}%
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
      <p className="mt-4 text-lg font-semibold">{uploadStatus}</p>
    </div>
  );
}

export default UploadProgressComponent;
