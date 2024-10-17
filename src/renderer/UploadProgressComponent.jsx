import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import videoIcon from '../../assets/icons/video-file.png';
import axios from 'axios';
import fetcher from '../fetcher';
import {
  UPLOAD_CHUNK,
  ENCODING,
  UPLOAD_NOTIFICATION,
  UPLOAD_LOG,
  DELETE_FILE,
} from '../constants/api_constant';

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

  // 컴포넌트 언마운트 시 클린업 추가
  useEffect(() => {
    return () => {
      // 로컬스토리지에서 완료된 업로드를 지우는 함수
      const cleanCompletedUploads = () => {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith('uploadProgress_') &&
            key.endsWith(`_${accountId}`)
          ) {
            const progressData = JSON.parse(localStorage.getItem(key));
            const fileName = key.split('_').slice(1, -1).join('_');
            const chunkProgressKey = `chunkProgress_${fileName}_${accountId}`;
            const chunkProgress = JSON.parse(
              localStorage.getItem(chunkProgressKey),
            );

            if (progressData && progressData.progress === 100) {
              // 인코딩 요청 상태 확인
              if (chunkProgress && chunkProgress.encodingRequested) {
                // 인코딩 요청이 보내졌으면 청크 프로그레스와 업로드 프로그레스 모두 삭제
                localStorage.removeItem(key); // 업로드 진행 상태 삭제
                localStorage.removeItem(chunkProgressKey); // 청크 진행 상태 삭제
                console.log(`No encoding request for ${fileName}, deleting.`);
              }
            }
          }
        });
      };

      cleanCompletedUploads(); // 컴포넌트 언마운트 시 실행
    };
  }, [accountId]);

  // 컴포넌트가 마운트될 때 로컬스토리지에서 업로드 퍼센트 읽어오는 코드
  useEffect(() => {
    const updateProgress = () => {
      const updatedProgress = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('uploadProgress_') && key.endsWith(`${accountId}`)) {
          const fileName = key
            .replace('uploadProgress_', '')
            .replace(`_${accountId}`, '');
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
    return () => {
      clearInterval(interval);
    };
  }, []);

  // 컴포넌트가 마운트될 때 로컬스토리지에서 일시정지 상태를 읽어오는 코드
  useEffect(() => {
    const readPausedFiles = () => {
      const updatedPausedFiles = new Set();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.endsWith('_paused') && localStorage.getItem(key) === 'true') {
          const fileName = key
            .replace('_paused', '')
            .replace(`_${accountId}`, '');
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

  // 업로드, 인코딩 관련 로그
  const uploadLog = (accountId, message) => {
    const dto = {
      accountId: accountId,
      message: message,
    };
    fetcher.post(UPLOAD_LOG, dto, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  // 청크 업로드 함수
  const uploadChunks = async (file, savedResource, fileTitle, chunkindex) => {
    const uuidFileName = savedResource.filename;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = chunkindex || 0;

    while (chunkIndex < totalChunks) {
      const isPaused =
        localStorage.getItem(`${fileTitle}_${accountId}_paused`) === 'true';
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
        const response = await fetcher.post(UPLOAD_CHUNK, chunkFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.min(
              100,
              Math.round(
                ((chunkIndex * CHUNK_SIZE + progressEvent.loaded) / file.size) *
                  100,
              ),
            );

            // 로컬스토리지에 업로드 진행퍼센트 업데이트
            const existingData =
              JSON.parse(
                localStorage.getItem(
                  `uploadProgress_${fileTitle}_${accountId}`,
                ),
              ) || {};
            localStorage.setItem(
              `uploadProgress_${fileTitle}_${accountId}`,
              JSON.stringify({ ...existingData, progress: percentCompleted }),
            );

            // 로클스토리지에 어느 청크까지 업로드되었는지 업데이트
            const chunkProgress = JSON.parse(
              localStorage.getItem(`chunkProgress_${fileTitle}_${accountId}`),
            );
            chunkProgress.chunkIndex = chunkIndex + 1; // 청크 인덱스를 현재 업로드된 위치로 업데이트
            localStorage.setItem(
              `chunkProgress_${fileTitle}_${accountId}`,
              JSON.stringify(chunkProgress),
            );
          },
        });

        if (response.status !== 200) {
          throw new Error('파일 청크 업로드 실패');
        }

        chunkIndex++;

        // 청크 업로드가 완료된 경우, 상태를 업데이트
        if (chunkIndex >= totalChunks) {
          const existingData =
            JSON.parse(
              localStorage.getItem(`chunkProgress_${fileTitle}_${accountId}`),
            ) || {};
          existingData.uploadCompleted = true;
          localStorage.setItem(
            `chunkProgress_${fileTitle}_${accountId}`,
            JSON.stringify(existingData),
          );

          // 파일 업로드 되었을 때 토스트 알림
          // 메인 프로세스에 알림 전송
          // window.electron.uploadComplete('upload-complete', fileTitle);

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

          // 업로드 로그 저장
          uploadLog(accountId, `${fileTitle} 업로드 완료`);

          // 알림 저장 함수 호출
          uploadNotification(accountId, fileTitle, resourceType);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          window.alert('업로드 중지');
          break;
        } else {
          // 업로드 실패 로그
          uploadLog(accountId, `${fileTitle} 업로드 실패`);
          throw error;
        }
      }
    }
  };

  // 인코딩 요청 함수
  const requestEncoding = async (
    file,
    savedResource,
    encodings,
    title,
    accountId,
  ) => {
    // 중복된 포맷-해상도 조합을 제거하는 함수
    const removeDuplicateEncodings = (encodings) => {
      const uniqueEncodings = [];
      const seenCombinations = new Set();

      encodings.forEach((encoding) => {
        const combination = `${encoding.format}-${encoding.resolution}`;
        if (!seenCombinations.has(combination)) {
          seenCombinations.add(combination);
          uniqueEncodings.push(encoding);
        }
      });

      return uniqueEncodings;
    };

    // 중복 값 제거 후 처리
    const uniqueEncodings = removeDuplicateEncodings(encodings);

    const encodingsWithFileNames = {
      [savedResource.filename]: {
        encodings: uniqueEncodings, // 중복 제거된 인코딩 정보
        title: title || file.name.split('.').slice(0, -1).join('.'),
        accountId: accountId,
      },
    };

    // 인코딩 요청을 전송하기 전 로컬스토리지에 상태 저장
    const fileTitle = title || file.name.split('.').slice(0, -1).join('.');
    const chunkProgressKey = `chunkProgress_${fileTitle}_${accountId}`;
    const chunkProgress =
      JSON.parse(localStorage.getItem(chunkProgressKey)) || {};

    chunkProgress.encodingRequested = true; // 인코딩 요청 상태를 true로 설정
    localStorage.setItem(chunkProgressKey, JSON.stringify(chunkProgress));

    console.log(encodingsWithFileNames);

    return fetcher.post(ENCODING + `/${accountId}`, encodingsWithFileNames, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  // 알림 데이터베이스 저장 요청 함수
  const uploadNotification = async (account, message, resourceType) => {
    try {
      const requestData = {
        account,
        message,
        resourceType,
      };

      const response = await fetcher.post(UPLOAD_NOTIFICATION, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
    localStorage.setItem(`${fileName}_${accountId}_paused`, 'true');
  };

  // 재개 기능
  const resumeUpload = async (fileName) => {
    // 일시정지 상태를 로컬스토리지에서 제거
    localStorage.removeItem(`${fileName}_${accountId}_paused`);

    const chunkProgress = JSON.parse(
      localStorage.getItem(`chunkProgress_${fileName}_${accountId}`),
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
            localStorage.getItem(`chunkProgress_${fileTitle}_${accountId}`),
          );
          return progress && progress.uploadCompleted;
        };

        if (isFileUploaded(savedResource.fileTitle)) {
          console.log('savedResource.fileTitle' + savedResource.fileTitle);
          const encodings = JSON.parse(
            localStorage.getItem(
              `chunkProgress_${savedResource.fileTitle}_${accountId}`,
            ),
          ).encodings;

          // 인코딩 요청
          await requestEncoding(
            file,
            savedResource,
            encodings,
            savedResource.fileTitle,
            accountId,
          );

          // 인코딩 그룹 토스트 알림
          window.electron.encodingComplete(`${savedResource.fileTitle} 파일`);
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

  // 파일 삭제 함수
  const deleteFileFromServer = async (fileName) => {
    try {
      const response = await fetcher.post(DELETE_FILE, { fileName, accountId });

      if (response.status !== 200) {
        throw new Error('파일 삭제 실패');
      }
      console.log(`${fileName} 삭제 완료`);
    } catch (error) {
      console.error('파일 삭제 중 오류 발생: ', error);
    }
  };

  // 삭제 버튼 클릭
  const handleDelete = (fileName) => {
    localStorage.removeItem(`uploadProgress_${fileName}_${accountId}`);
    localStorage.removeItem(`chunkProgress_${fileName}_${accountId}`);
    localStorage.removeItem(`${fileName}_${accountId}_paused`);
    setProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      delete newProgress[fileName];
      return newProgress;
    });

    deleteFileFromServer(fileName);
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
    <div className="p-4 min-h-screen flex flex-col">
      {/* 제목은 맨 위에 고정 */}
      <h2 className="text-2xl font-bold mb-6 text-gray-700 text-left">
        업로드 진행 상황
      </h2>

      {/* 업로드 중인 파일이 없을 경우 메시지 출력 */}
      {Object.keys(progress).length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="flex items-center justify-center text-gray-400 mb-4">
            <p className="text-gray-600 text-xl font-semibold animate-pulse">
              업로드 중인 파일이 없습니다.
            </p>
          </div>
        </div>
      ) : (
        Object.entries(progress).map(([fileName, { progress, previewUrl }]) => (
          <div
            key={fileName}
            className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-md border border-gray-200"
          >
            {/* 미리보기 이미지 */}
            <div className="w-1/6">
              {previewUrl && previewUrl !== 'video-icon' ? (
                <img
                  src={previewUrl}
                  alt={`${fileName} preview`}
                  className="w-full h-auto rounded-md"
                />
              ) : (
                <img
                  src={videoIcon}
                  alt={`${fileName} preview`}
                  className="w-full h-auto rounded-md"
                />
              )}
            </div>

            {/* 파일 정보 및 진행률 */}
            <div className="w-4/6 pl-4">
              <p
                className="text-lg font-semibold text-gray-700 truncate"
                title={fileName}
              >
                {fileName.length > 30
                  ? `${fileName.slice(0, 30)}...`
                  : fileName}
              </p>
              <div className="relative w-full h-4 bg-gray-300 rounded-full mt-2">
                <div
                  className={`h-4 rounded-full ${
                    progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress}%</p>
            </div>

            {/* 조작 버튼들 또는 업로드 완료 메시지 */}
            <div className="w-1/6 flex items-center justify-end space-x-2">
              {progress < 100 ? (
                <>
                  <button
                    onClick={() => handlePauseResume(fileName)}
                    className={`${
                      pausedFilesState.has(fileName)
                        ? 'bg-yellow-400 hover:bg-yellow-500'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-bold w-9 h-9 rounded-full flex items-center justify-center`}
                    title={pausedFilesState.has(fileName) ? 'Resume' : 'Pause'}
                  >
                    {pausedFilesState.has(fileName) ? '▶️' : '⏸️'}
                  </button>
                  {pausedFilesState.has(fileName) && (
                    <button
                      onClick={() => handleDelete(fileName)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center"
                    >
                      X
                    </button>
                  )}
                </>
              ) : (
                <span className="text-green-500 font-bold">업로드 완료</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default UploadProgressComponent;
