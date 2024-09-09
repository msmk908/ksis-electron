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
  } = location.state || {};
  const [progress, setProgress] = useState({});
  const [pausedFilesState, setPausedFilesState] = useState(new Set());

  // 로컬스토리지에서 accountId 가져오기
  const accountId = localStorage.getItem('accountId');

  // 컴포넌트가 마운트될 때 로컬스토리지에서 업로드 퍼센트 읽어오는 코드
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

  // 컴포넌트가 마운트될 때 로컬스토리지에서 일시정지 상태를 읽어오는 코드
  useEffect(() => {
    const readPausedFiles = () => {
      const updatedPausedFiles = new Set();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.endsWith('_paused') && localStorage.getItem(key) === 'true') {
          const fileName = key.replace('_paused', '');
          updatedPausedFiles.add(fileName);
        }
      }

      setPausedFilesState(updatedPausedFiles);
    };

    readPausedFiles();
    window.addEventListener('storage', readPausedFiles); // 로컬스토리지의 변화 감지

    return () => {
      window.removeEventListener('storage', readPausedFiles); // 컴포넌트 언마운트 시 이벤트 제거
    };
  }, []);

  // 청크 업로드 함수
  const uploadChunks = async (file, savedResource, fileTitle, chunkindex) => {
    const uuidFileName = savedResource.filename;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = chunkindex || 0;

    while (chunkIndex < totalChunks) {
      const isPaused = localStorage.getItem(`${fileTitle}_paused`) === 'true';
      if (isPaused) {
        // 로컬스토리지에 paused 가 true 일 때 정지
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
        const response = await axios.post(
          'http://localhost:8080/api/upload/chunk',
          chunkFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
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

        // 청크 업로드가 완료된 경우, 상태를 업데이트
        if (chunkIndex >= totalChunks) {
          const existingData =
            JSON.parse(localStorage.getItem(`chunkProgress_${fileTitle}`)) ||
            {};
          existingData.uploadCompleted = true;
          localStorage.setItem(
            `chunkProgress_${fileTitle}`,
            JSON.stringify(existingData),
          );

          // 파일 업로드 되었을 때 토스트 알림
          // 메인 프로세스에 알림 전송
          window.electron.uploadComplete('upload-complete', fileTitle);

          // 파일 타입에 따른 resourceType 설정
          let resourceType = '';
          if (file.type.startsWith('video/')) {
            resourceType = 'VIDEO';
          } else if (file.type.startsWith('image/')) {
            resourceType = 'IMAGE';
          } else {
            // MIME 타입이 비정상적일 경우 확장자를 기준으로 처리
            const extension = savedResource.filename
              .split('.')
              .pop()
              .toLowerCase();

            if (['mp4', 'mkv', 'mov', 'avi'].includes(extension)) {
              resourceType = 'VIDEO';
            } else if (
              ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)
            ) {
              resourceType = 'IMAGE';
            } else {
              console.warn('알 수 없는 파일 형식입니다:', extension);
            }
          }

          console.log('Resource Type:', resourceType);

          // 알림 저장 함수 호출
          uploadNotification(accountId, fileTitle, resourceType);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          window.alert('업로드 중지');
          break;
        } else {
          throw error;
        }
      }
    }
  };

  // 인코딩 요청 함수
  const requestEncoding = async (
    file,
    savedResource,
    encoding,
    title,
    accountId,
  ) => {
    console.log('인코딩 요청');
    const encodingsWithFileNames = {
      [savedResource.filename]: {
        encodings: encoding, // 단일 파일의 인코딩 정보
        title: title || file.name.split('.').slice(0, -1).join('.'),
        accountId: accountId,
      },
    };

    return axios.post(
      'http://localhost:8080/api/encoding',
      encodingsWithFileNames,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  };

  // 알림 데이터베이스 저장 요청 함수
  const uploadNotification = async (account, message, resourceType) => {
    try {
      const requestData = {
        account,
        message,
        resourceType,
      };

      const response = await fetch(
        'http://localhost:8080/api/upload/notification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // 일시정지 기능
  const pauseUpload = (fileName) => {
    // 일시정지 상태를 로컬스토리지에 저장
    localStorage.setItem(`${fileName}_paused`, 'true');
  };

  // 재개 기능
  const resumeUpload = async (fileName) => {
    // 일시정지 상태를 로컬스토리지에서 제거
    localStorage.removeItem(`${fileName}_paused`);

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
          await uploadChunks(file, savedResource, fileName, chunkindex);
        }

        // 모든 파일의 청크 업로드가 완료된 후 인코딩 요청
        const isFileUploaded = (fileTitle) => {
          const progress = JSON.parse(
            localStorage.getItem(`chunkProgress_${fileTitle}`),
          );
          return progress && progress.uploadCompleted;
        };

        if (isFileUploaded(savedResource.fileTitle)) {
          console.log('savedResource.fileTitle' + savedResource.fileTitle);
          const encodings = JSON.parse(
            localStorage.getItem(`chunkProgress_${savedResource.fileTitle}`),
          ).encodings;

          // 인코딩 요청
          await requestEncoding(
            file,
            savedResource,
            encodings,
            savedResource.fileTitle,
            accountId,
          );
        } else {
          console.log('청크 업로드 미완료');
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
                      pausedFilesState.has(fileName)
                        ? 'bg-yellow-500 hover:bg-yellow-700'
                        : 'bg-blue-500 hover:bg-blue-700'
                    } text-white font-bold px-2 py-1 rounded-full transition duration-300 ease-in-out`}
                    title={pausedFilesState.has(fileName) ? 'Resume' : 'Pause'}
                  >
                    {pausedFilesState.has(fileName) ? '▶️' : '⏸️'}
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
