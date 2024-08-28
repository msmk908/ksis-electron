import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import videoIcon from '../../assets/icons/video-file.png';

function UploadProgressComponent() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const updateProgress = () => {
      const updatedProgress = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('uploadProgress_')) {
          const fileName = key.replace('uploadProgress_', '');
          const storeData = JSON.parse(localStorage.getItem(key));

          if (storeData) {
            updatedProgress[fileName] = {
              progress: storeData.progress,
              previewUrl: storeData.previewUrl,
            };
          }
        }
      }
      setProgress(updatedProgress);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, []);

  const sortedProgressEntries = Object.entries(progress).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">업로드 진행 상황</h2>
      {Object.entries(progress).map(([fileName, { progress, previewUrl }]) => (
        <div key={fileName} className="mb-4 flex items-center">
          <div className="w-1/4 pr-4">
            {previewUrl && previewUrl !== 'video-icon' ? (
              <img
                src={previewUrl}
                alt={`${fileName} preview`}
                className="w-full h-auto rounded-lg shadow-md"
              />
            ) : (
              <img
                src={videoIcon}
                alt={`${fileName} preview`}
                className="w-full h-auto rounded-lg shadow-md"
              />
            )}
          </div>
          <div className="w-3/4">
            <p className="mb-1 text-lg">{fileName}</p>
            <div className="w-full bg-gray-300 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-right text-sm mt-1">{progress}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UploadProgressComponent;
