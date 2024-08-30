import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import videoIcon from '../../assets/icons/video-file.png';

function UploadProgressComponent() {
  const [progress, setProgress] = useState({});
  const [pausedFiles, setPausedFiles] = useState(new Set());

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

  // 삭제 버튼 클릭
  const handleDelete = (fileName) => {
    localStorage.removeItem(`uploadProgress_${fileName}`);
    localStorage.removeItem(`chunkProgress_${fileName}`);
    setProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  // 일시정지 및 재개 버튼 클릭
  const handlePauseResume = (fileName) => {
    setPausedFiles((prevPausedFiles) => {
      const updatedPausedFiles = new Set(prevPausedFiles);
      if (updatedPausedFiles.has(fileName)) {
        // 파일이 일시정지된 상태에서 클릭한 경우, 일시정지 해제
        updatedPausedFiles.delete(fileName);
        // 재개 로직 추가
      } else {
        // 파일이 업로드 중인 상태에서 클릭한 경우, 일시정지
        updatedPausedFiles.add(fileName);
        // 일시정지 로직 추가
      }
      return updatedPausedFiles;
    });
  };

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
            <div className="flex items-center">
              <div className="w-11/12 bg-gray-300 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${
                    progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {progress < 100 && (
                <div className="w-1/12 text-right pl-2">
                  <button
                    onClick={() => handlePauseResume(fileName)}
                    className={`${
                      pausedFiles.has(fileName)
                        ? 'bg-yellow-500 hover:bg-yellow-700'
                        : 'bg-blue-500 hover:bg-blue-700'
                    } text-white font-bold px-2 py-1 rounded-full transition duration-300 ease-in-out`}
                    title={pausedFiles.has(fileName) ? 'Resume' : 'Pause'}
                  >
                    {pausedFiles.has(fileName) ? '▶️' : '⏸️'}
                  </button>
                </div>
              )}
              {progress === 100 && (
                <div className="w-1/12 text-right pl-2">
                  <button
                    onClick={() => handleDelete(fileName)}
                    className="bg-red-500 text-white font-bold px-2 py-1 rounded-full hover:bg-red-700 transition duration-300 ease-in-out"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <p className="text-right text-sm mt-1">{progress}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UploadProgressComponent;
