import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import videoIcon from '../../assets/icons/video-file.png';
import axios from 'axios';

function UploadProgressComponent() {
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB로 청크 사이즈 설정
  const location = useLocation();
  const {
    files = [],
    titles = {},
    encodings = {},
    resolutions = {},
    cancelTokens = new Map(),
    pausedFiles = new Set(),
  } = location.state || {};
  const [progress, setProgress] = useState({});
  const [pausedFilesState, setPausedFilesState] = useState(pausedFiles);

  // 유즈 이펙트
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

  // 청크 업로드 함수
  const uploadChunks = async (file, savedResource, fileTitle, chunkindex) => {
    console.log('청크 업로드 함수 진입');
    const uuidFileName = savedResource.filename;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = chunkindex || 0;

    // 현재 업로드 요청을 취소할 수 있는 토큰 생성
    if (!cancelTokens.has(fileTitle)) {
      cancelTokens.set(fileTitle, axios.CancelToken.source());
    }

    const cancelToken = cancelTokens.get(fileTitle).token;

    while (chunkIndex < totalChunks) {
      if (pausedFiles.has(fileTitle)) {
        // 업로드가 일시정지 상태일 때, 청크 업로드를 중단
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('file', chunk);
      chunkFormData.append('fileName', uuidFileName);
      chunkFormData.append('chunkIndex', chunkIndex);
      chunkFormData.append('totalChunks', totalChunks);

      try {
        console.log('청크 업로드 요청 보내기');
        const response = await axios.post(
          'http://localhost:8080/api/upload/chunk',
          chunkFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            cancelToken: cancelToken,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.min(
                100,
                Math.round(
                  ((chunkIndex * CHUNK_SIZE + progressEvent.loaded) /
                    file.size) *
                    100,
                ),
              );

              // 로컬스토리지에 업로드 진행퍼센트 업데이트
              const existingData =
                JSON.parse(
                  localStorage.getItem(`uploadProgress_${fileTitle}`),
                ) || {};
              localStorage.setItem(
                `uploadProgress_${fileTitle}`,
                JSON.stringify({ ...existingData, progress: percentCompleted }),
              );

              // 로클스토리지에 어느 청크까지 업로드되었는지 업데이트
              const chunkProgress = JSON.parse(
                localStorage.getItem(`chunkProgress_${fileTitle}`),
              );
              chunkProgress.chunkIndex = chunkIndex + 1; // 청크 인덱스를 현재 업로드된 위치로 업데이트
              localStorage.setItem(
                `chunkProgress_${fileTitle}`,
                JSON.stringify(chunkProgress),
              );
            },
          },
        );

        if (response.status !== 200) {
          throw new Error('파일 청크 업로드 실패');
        }

        chunkIndex++;
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Upload cancelled');
          break;
        } else {
          throw error;
        }
      }
    }
  };

  // 일시정지 기능
  const pauseUpload = (fileName) => {
    // 일시정지 상태를 로컬스토리지에 저장
    localStorage.setItem(`${fileName}_paused`, 'true');

    // 요청 취소
    if (cancelTokens.has(fileName)) {
      cancelTokens.get(fileName).cancel();
    }
  };

  // 재개 기능
  const resumeUpload = async (fileName) => {
    // 일시정지 상태를 로컬스토리지에서 제거
    localStorage.removeItem(`${fileName}_paused`);

    // 취소 토큰을 새로 생성
    if (cancelTokens.has(fileName)) {
      cancelTokens.set(fileName, axios.CancelToken.source());
    }

    const chunkProgress = JSON.parse(
      localStorage.getItem(`chunkProgress_${fileName}`),
    );

    const chunkindex = chunkProgress.chunkIndex;

    const savedResource = chunkProgress.savedResources;

    // 로컬스토리지에서 파일 경로를 가져옴
    const filePath = chunkProgress?.filePath;

    if (filePath) {
      try {
        // ipcRenderer를 통해 파일 데이터를 가져옴
        const fileBuffer = await window.electron.ipcRenderer.invoke(
          'get-file',
          filePath,
        );

        // 가져온 파일 데이터를 Blob 또는 File 객체로 변환
        const file = new File([fileBuffer], savedResource.filename, {
          type: savedResource.format,
        });

        // 업로드 재개
        if (file && savedResource) {
          console.log('다시 업로드');
          await uploadChunks(file, savedResource, fileName, chunkindex);
        }
      } catch (error) {
        console.error('파일을 가져오는 중 오류 발생:', error);
      }
    } else {
      console.error('파일 경로를 찾을 수 없습니다.');
    }
  };

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
  const handlePauseResume = async (fileName) => {
    setPausedFilesState((prevPausedFiles) => {
      const updatedPausedFiles = new Set(prevPausedFiles);
      if (updatedPausedFiles.has(fileName)) {
        // 파일이 일시정지된 상태에서 클릭한 경우, 일시정지 해제
        updatedPausedFiles.delete(fileName);
        // 재개 로직 추가
        resumeUpload(fileName);
      } else {
        // 파일이 업로드 중인 상태에서 클릭한 경우, 일시정지
        updatedPausedFiles.add(fileName);
        // 일시정지 로직 추가
        pauseUpload(fileName);
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
