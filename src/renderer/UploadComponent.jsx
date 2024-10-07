import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { useNavigate } from 'react-router-dom';
import fetcher from '../fetcher';
import FileItem from './FileItem';
import {
  FILEDATA_SAVE,
  UPLOAD_CHUNK,
  ENCODING,
  UPLOAD_NOTIFICATION,
  UPLOAD_LOG,
  FILE_SIZE,
  RESOLUTION,
  SAME_TITLE,
  DELETE_FILE,
} from '../constants/api_constant';
import { UPLOAD_PROGRESS } from '../constants/page_constant';
import Modal from './ErrorModal'; // 모달 컴포넌트

function UploadComponent() {
  const [files, setFiles] = useState([]); // 첨부한 파일 저장
  const [filePreview, setFilePreviews] = useState({}); // 파일 미리보기 URL 저장
  const [titles, setTitles] = useState({}); // 파일 제목 저장
  const [encodings, setEncodings] = useState({}); // 파일 인코딩 설정 저장
  const [resolutions, setResolutions] = useState({}); // 원본 해상도 저장
  const [fileSizeLimit, setFileSizeLimit] = useState({}); // 파일 크기 제한 저장
  const [titlesVerified, setTitlesVerified] = useState(false);
  const [errors, setErrors] = useState({}); // 에러 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 추가
  const [modalMessage, setModalMessage] = useState(''); // 모달 메시지 관리
  const fileInputRef = useRef(null); // 파일첨부 기능
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB로 청크 사이즈 설정
  const navigate = useNavigate(); // 네비게이트 훅 사용

  // 모달 보여주는 메서드
  const showModal = (message) => {
    setModalMessage(message);
    setIsModalOpen(true);
  };

  // 로컬스토리지에서 accountId 가져오기
  const accountId = localStorage.getItem('accountId');

  // 확장자 화이트리스트
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'bmp',
    'mp4',
    'mov',
    'avi',
    'mkv',
  ];

  // 파일 크기 제한을 가져오는 함수
  useEffect(() => {
    const fileSizeLimit = async () => {
      try {
        const response = await fetcher.get(FILE_SIZE);
        setFileSizeLimit(response.data);
      } catch (error) {
        console.error('파일 크기 제한을 가져오는데 실패했습니다', error);
      }
    };
    fileSizeLimit();
  }, []);

  // 확장자 화이트리스트 검증
  const isExtensionAllowed = (fileName) => {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    return allowedExtensions.includes(fileExtension);
  };

  // 첨부파일 추가 메서드
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);

    // 파일 화이트리스트 검증
    const invalidFiles = newFiles.filter(
      (file) => !isExtensionAllowed(file.name),
    );

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((file) => file.name).join(', ');
      window.alert(
        '허용되지 않은 파일 형식이 있습니다. 허용되지 않는 파일: ' +
          invalidFileNames,
      );
      return;
    }

    // 파일 용량 검증
    const exceededFiles = newFiles.filter((file) => {
      if (
        file.type.startsWith('image/') &&
        file.size > fileSizeLimit.imageMaxSize * 1000000
      ) {
        return true; // 이미지 파일 크기 초과
      }
      if (
        file.type.startsWith('video/') &&
        file.size > fileSizeLimit.videoMaxSize * 1000000
      ) {
        return true; // 비디오 파일 크기 초과
      }
      return false;
    });

    if (exceededFiles.length > 0) {
      showModal('한번에 올릴 수 있는 파일 크기를 초과했습니다.');
      return; // 파일 첨부 중단
    }

    const newResolutions = await getFileInfo(newFiles, files.length); // 파일 인덱스를 전달

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...newFiles];
      setResolutions((prevResolutions) => ({
        ...prevResolutions,
        ...newResolutions,
      }));

      const newEncodings = newFiles.reduce((acc, file, index) => {
        const fileIndex = prevFiles.length + index;
        const isImage = file.type.startsWith('image/');
        acc[fileIndex] = [{ format: isImage ? 'jpg' : 'mp4' }];
        return acc;
      }, {});

      setEncodings((prevEncodings) => ({
        ...prevEncodings,
        ...newEncodings,
      }));

      // 파일 이름을 기본 제목으로 titles에 추가
      const newTitles = newFiles.reduce((acc, file, index) => {
        const fileIndex = prevFiles.length + index;
        acc[fileIndex] = file.name.split('.').slice(0, -1).join('.');
        return acc;
      }, {});

      setTitles((prevTitles) => ({
        ...prevTitles,
        ...newTitles,
      }));

      return updatedFiles;
    });

    newFiles.forEach((file, index) => {
      const fileUrl = URL.createObjectURL(file);
      setFilePreviews((prevPreviews) => ({
        ...prevPreviews,
        [files.length + index]: fileUrl,
      }));
    });
  };

  // 드래그 드롭 메서드
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newFiles = Array.from(e.dataTransfer.files);

    // 파일 화이트리스트 검증
    const invalidFiles = newFiles.filter(
      (file) => !isExtensionAllowed(file.name),
    );

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((file) => file.name).join(', ');
      window.alert(
        '허용되지 않은 파일 형식이 있습니다. 허용되지 않는 파일: ' +
          invalidFileNames,
      );
      return;
    }

    // 파일 용량 검증
    const exceededFiles = newFiles.filter((file) => {
      if (
        file.type.startsWith('image/') &&
        file.size > fileSizeLimit.imageMaxSize * 1000000
      ) {
        return true; // 이미지 파일 크기 초과
      }
      if (
        file.type.startsWith('video/') &&
        file.size > fileSizeLimit.videoMaxSize * 1000000
      ) {
        return true; // 비디오 파일 크기 초과
      }
      return false;
    });

    if (exceededFiles.length > 0) {
      showModal('한번에 올릴 수 있는 파일 크기를 초과했습니다.');
      return; // 파일 첨부 중단
    }

    const newResolutions = await getFileInfo(newFiles, files.length); // 파일 인덱스를 전달

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...newFiles];
      setResolutions((prevResolutions) => ({
        ...prevResolutions,
        ...newResolutions,
      }));

      const newEncodings = newFiles.reduce((acc, file, index) => {
        const fileIndex = prevFiles.length + index;
        const isImage = file.type.startsWith('image/');
        acc[fileIndex] = [
          { format: isImage ? 'jpg' : 'mp4', resolution: '1080p' },
        ];
        return acc;
      }, {});

      setEncodings((prevEncodings) => ({
        ...prevEncodings,
        ...newEncodings,
      }));

      // 파일 이름을 기본 제목으로 titles에 추가
      const newTitles = newFiles.reduce((acc, file, index) => {
        const fileIndex = prevFiles.length + index;
        acc[fileIndex] = file.name.split('.').slice(0, -1).join('.');
        return acc;
      }, {});

      setTitles((prevTitles) => ({
        ...prevTitles,
        ...newTitles,
      }));

      return updatedFiles;
    });

    // 미리보기 URL 추가
    newFiles.forEach((file, index) => {
      const fileUrl = URL.createObjectURL(file);
      setFilePreviews((prevPreviews) => ({
        ...prevPreviews,
        [files.length + index]: fileUrl,
      }));
    });
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (index) => {
    setFiles((prevFiles) => {
      // 삭제할 파일을 제외한 새로운 파일 목록 생성
      const updatedFiles = prevFiles.filter((_, i) => i !== index);

      // 삭제된 파일의 인덱스에 해당하는 상태만 제거
      const updatedEncodings = {};
      const updatedResolutions = {};
      const updatedTitles = {};

      updatedFiles.forEach((_, i) => {
        // 기존의 인덱스 맵을 유지
        updatedEncodings[i] = encodings[i >= index ? i + 1 : i] || [];
        updatedResolutions[i] = resolutions[i >= index ? i + 1 : i] || {};
        updatedTitles[i] = titles[i >= index ? i + 1 : i] || '';
      });

      setEncodings(updatedEncodings);
      setResolutions(updatedResolutions);
      setTitles(updatedTitles);

      return updatedFiles;
    });

    // 미리보기 URL 제거 및 재정렬
    setFilePreviews((prevPreviews) => {
      const updatedPreviews = {};
      files
        .filter((_, i) => i !== index) // 파일 삭제된 것 제외
        .forEach((file, i) => {
          updatedPreviews[i] = prevPreviews[i >= index ? i + 1 : i];
        });
      return updatedPreviews;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 제목 설정
  const handleTitleChange = (index, newTitle) => {
    setTitles((prevTitles) => ({
      ...prevTitles,
      [index]: newTitle,
    }));
  };

  // 포맷 설정
  const handleFormatChange = (fileIndex, encodingIndex, e) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex][encodingIndex].format = e.target.value;
    setEncodings(newEncodings);
  };

  // 해상도 설정
  const handleResolutionChange = (fileIndex, encodingIndex, e) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex][encodingIndex].resolution = e.target.value;
    setEncodings(newEncodings);
  };

  // 포맷 해상도 추가
  const addEncoding = async (fileIndex) => {
    const newEncodings = { ...encodings };

    // 가져온 해상도 목록 중 첫 번재 값을 기본값으로 설정
    const response = await fetcher.get(RESOLUTION);
    newEncodings[fileIndex] = [
      ...newEncodings[fileIndex],
      {
        format: encodings[fileIndex][0].format,
        resolution: `${response.data[0].width}x${response.data[0].height}`,
      }, // 동일한 포맷으로 추가
    ];
    setEncodings(newEncodings);
  };

  // 포맷 해상도 제거
  const removeEncoding = (fileIndex, encodingIndex) => {
    const newEncodings = { ...encodings };
    if (newEncodings[fileIndex].length > 1) {
      newEncodings[fileIndex].splice(encodingIndex, 1);
      setEncodings(newEncodings);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current.click();
  };

  // 파일의 정보를 가져오는 함수
  const getFileInfo = (files, startIndex) => {
    return Promise.all(
      files.map((file, index) => {
        return new Promise((resolve) => {
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          const url = URL.createObjectURL(file);

          if (isImage) {
            const img = new Image();
            img.onload = () => {
              resolve({
                [startIndex + index]: {
                  width: img.width,
                  height: img.height,
                  playtime: null,
                },
              });
              URL.revokeObjectURL(img.src);
            };
            img.src = url;
          } else if (isVideo) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
              resolve({
                [startIndex + index]: {
                  width: video.videoWidth,
                  height: video.videoHeight,
                  playtime: video.duration,
                },
              });
              URL.revokeObjectURL(video.src);
            };
            video.onerror = () => {
              resolve({
                [startIndex + index]: {
                  width: null,
                  height: null,
                  playtime: null,
                },
              });
              URL.revokeObjectURL(video.src);
            };
            video.src = url;
          } else {
            resolve({
              [startIndex + index]: {
                width: null,
                height: null,
                playtime: null,
              },
            });
          }
        });
      }),
    ).then((resolutions) => {
      return resolutions.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    });
  };

  // 파일을 base64로 변환하는 함수
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 업로드, 인코딩 관련 로그
  const uploadLog = (accountId, message) => {
    const dto = {
      accountId: accountId,
      message: message,
    };
    fetcher.post(UPLOAD_LOG, dto);
  };

  // 메타데이터 저장 함수
  const saveMetadata = async (files, titles, resolutions) => {
    const formData = new FormData();
    const dtos = [];

    await Promise.all(
      files.map(async (file, index) => {
        // 원본 파일의 확장자 추출 (확장자에서 . 제거)
        const format = file.name.split('.').pop().toLowerCase();
        // 파일 제목 설정 (제목이 없는 경우 파일 이름을 사용)
        const fileTitle = String(
          titles[index] || file.name.split('.').slice(0, -1).join('.'),
        );
        // 해상도 문자열 생성
        const resolution = `${resolutions[index]?.width || ''}x${resolutions[index]?.height || ''}`;
        // 재생시간
        const playTime = resolutions[index].playtime || '0';
        // 파일 타입
        const resourceType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';

        // 로컬스토리지에 업로드할 파일미리보기, 업로드 진행률 0%로 저장
        localStorage.setItem(
          `uploadProgress_${String(fileTitle)}_${accountId}`,
          JSON.stringify({
            progress: 0,
            previewUrl:
              resourceType === 'IMAGE'
                ? await fileToBase64(file)
                : 'video-icon',
          }),
        );

        // 하나의 DTO에 해당하는 데이터를 JSON으로 변환하여 추가
        const dto = {
          account: accountId,
          fileTitle: fileTitle,
          playTime: playTime,
          format: format,
          resolution: resolution,
          status: 'UPLOADING',
          resourceType: resourceType,
        };

        dtos.push(dto); // DTO 리스트에 추가
        formData.append('files', file); // 파일 자체를 추가
      }),
    );

    // DTO 리스트를 JSON 배열로 변환하여 전송
    formData.append(
      'dtos',
      new Blob([JSON.stringify(dtos)], { type: 'application/json' }),
    );

    return fetcher.post(FILEDATA_SAVE + `/${accountId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  // 청크 업로드 함수
  const uploadChunks = async (file, savedResource, fileTitle) => {
    const uuidFileName = savedResource.filename;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = savedResource.chunkIndex || 0;

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
              `uploadProgress_${String(fileTitle)}_${accountId}`,
              JSON.stringify({ ...existingData, progress: percentCompleted }),
            );

            // 로클스토리지에 어느 청크까지 업로드되었는지 업데이트
            const chunkProgress = JSON.parse(
              localStorage.getItem(`chunkProgress_${fileTitle}_${accountId}`),
            );
            chunkProgress.chunkIndex = chunkIndex + 1; // 청크 인덱스를 현재 업로드된 위치로 업데이트
            localStorage.setItem(
              `chunkProgress_${String(fileTitle)}_${accountId}`,
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
            `chunkProgress_${String(fileTitle)}_${accountId}`,
            JSON.stringify(existingData),
          );

          // 파일 업로드 되었을 때 토스트 알림
          // 메인 프로세스에 알림 전송
          // window.electron.uploadComplete(fileTitle);

          // 파일 타입에 따른 resourceType 설정
          let resourceType = '';
          if (file.type.startsWith('video/')) {
            resourceType = 'VIDEO';
          } else if (file.type.startsWith('image/')) {
            resourceType = 'IMAGE';
          }

          // 업로드 완료 로그
          uploadLog(accountId, `${fileTitle} 업로드 완료`);

          // 알림 저장 함수 호출
          uploadNotification(accountId, fileTitle, resourceType);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          showModal('업로드 중지');
          break;
        } else {
          throw error;
        }
      }
    }
  };

  // 인코딩 요청 함수
  const requestEncoding = async (
    files,
    savedResources,
    encodings,
    titles,
    accountId,
  ) => {
    const encodingsWithFileNames = files.reduce((acc, file, index) => {
      acc[savedResources[index].filename] = {
        encodings: encodings[index],
        title: titles[index] || file.name.split('.').slice(0, -1).join('.'),
        accountId: accountId,
      };
      return acc;
    }, {});

    // 로컬스토리지에 인코딩 요청 전송 상태 저장
    savedResources.forEach((resource, index) => {
      const fileTitle =
        titles[index] || files[index].name.split('.').slice(0, -1).join('.');
      const chunkProgressKey = `chunkProgress_${fileTitle}_${accountId}`;
      const chunkProgress =
        JSON.parse(localStorage.getItem(chunkProgressKey)) || {};

      chunkProgress.encodingRequested = true; // 인코딩 요청 상태를 true로 설정
      localStorage.setItem(chunkProgressKey, JSON.stringify(chunkProgress));
    });

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

      await fetcher.post(UPLOAD_NOTIFICATION, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // 서버에서 제목 중복을 확인하고 새로운 제목을 반환하는 함수
  const checkTitleWithServer = async (title) => {
    try {
      const response = await fetcher.post(
        SAME_TITLE,
        { title: title.toString() },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        console.log('중복 반환받은 값: ' + response.data);
        return response.data;
      }
    } catch (error) {
      console.error('제목 중복 체크 오류: ', error);
      return title;
    }
  };

  // 파일 제목이 겹치는지 검증하고, 필요한 경우 수정하는 함수
  const titleVerification = async () => {
    // 제목이 입력되지 않은 파일을 찾음
    const emptyTitleFiles = files.filter((_, index) => !titles[index]);

    if (emptyTitleFiles.length > 0) {
      showModal('제목을 입력하세요.');
      return; // 업로드 중단
    }

    const updatedTitles = { ...titles };

    // 숫자가 15개 이상 연속으로 포함된 제목이 있는지 검사
    const invalidTitles = Object.values(titles).filter((title) =>
      /^\d{15,}$/.test(title),
    );

    if (invalidTitles.length > 0) {
      showModal('제목에 숫자가 15개 이상 연속으로 올 수 없습니다.');
      return; // 업로드 중단
    }

    // 각 파일 제목을 순차적으로 서버에 검증 요청
    await Promise.all(
      Object.keys(titles).map(async (key) => {
        const originalTitle = titles[key];
        const newTitle = await checkTitleWithServer(originalTitle);
        updatedTitles[key] = newTitle;
      }),
    );

    setTitles(updatedTitles);
    setTitlesVerified(true);
  };

  // 제목 검증 완료 후 처리
  useEffect(() => {
    if (titlesVerified) {
      handleUpload();
    }
  }, [titlesVerified]);

  // 업로드 버튼 함수
  const handleUpload = async () => {
    if (files.length == 0) {
      showModal('파일이 없습니다.'); // 다시 모달 열기
      setTitlesVerified(false);
      return;
    }

    // 해상도가 설정되지 않은 파일을 찾음
    const invalidEncodings = files.filter((file, index) => {
      const fileEncodings = encodings[index];
      // 인코딩 정보가 없거나, 인코딩 배열 내에 해상도가 없는 경우를 체크
      return (
        !fileEncodings || fileEncodings.some((encoding) => !encoding.resolution)
      );
    });

    if (invalidEncodings.length > 0) {
      showModal('해상도를 설정해주세요.');
      setTitlesVerified(false);
      return; // 업로드 중단
    }

    showModal('업로드를 진행합니다. 진행 상황 페이지로 이동합니다.');
    navigate(UPLOAD_PROGRESS, {
      state: {
        files,
        titles,
        encodings,
        resolutions,
      },
    }); // 페이지 이동

    try {
      const saveResponse = await saveMetadata(files, titles, resolutions);

      if (saveResponse.status === 200) {
        const savedResources = saveResponse.data;

        // 파일 제목과 파일 객체 매핑
        const fileTitleMap = files.reduce((acc, file, index) => {
          const title =
            titles[index] || file.name.split('.').slice(0, -1).join('.');
          acc[title] = file;
          return acc;
        }, {});

        savedResources.sort((a, b) => {
          const aIndex = files.indexOf(fileTitleMap[a.fileTitle]);
          const bIndex = files.indexOf(fileTitleMap[b.fileTitle]);
          return aIndex - bIndex;
        });

        // 로컬스토리지에 각 파일의 진행 상항과 필요한 데이터를 저장
        savedResources.forEach((resource, index) => {
          const fileTitle =
            titles[index] ||
            files[index].name.split('.').slice(0, -1).join('.');
          const filePath = files[index].path;
          const encoding = encodings[index];

          localStorage.setItem(
            `chunkProgress_${String(fileTitle)}_${accountId}`,
            JSON.stringify({
              chunkIndex: 0,
              filePath: filePath,
              savedResources: resource,
              encodings: encoding,
            }),
          );
        });

        // 청크 업로드 진행
        // **병렬로 청크 업로드 진행**
        await Promise.all(
          savedResources.map((resource, index) => {
            const file = files[index];
            const fileTitle =
              titles[index] || file.name.split('.').slice(0, -1).join('.');
            return uploadChunks(file, resource, fileTitle); // 청크 업로드 비동기 처리
          }),
        );

        // 정상적으로 업로드 완료된 파일들만 필터링
        const uploadedResources = savedResources.filter((resource) => {
          const progress = JSON.parse(
            localStorage.getItem(
              `chunkProgress_${resource.fileTitle}_${accountId}`,
            ),
          );
          return progress && progress.uploadCompleted;
        });

        // 인코딩 요청 (업로드가 완료된 파일들만 인코딩 요청)
        if (uploadedResources.length > 0) {
          const uploadedFiles = uploadedResources.map((resource) => {
            const fileTitle = resource.fileTitle;
            return files.find(
              (file, index) =>
                (titles[index] ||
                  file.name.split('.').slice(0, -1).join('.')) === fileTitle,
            );
          });

          const uploadedEncodings = uploadedResources.map((resource) => {
            const fileTitle = resource.fileTitle;
            const fileIndex = files.findIndex(
              (file, index) =>
                (titles[index] ||
                  file.name.split('.').slice(0, -1).join('.')) == fileTitle,
            );

            return encodings[fileIndex];
          });

          const uploadedTitles = uploadedResources.map(
            (resource) => resource.fileTitle,
          );
          await requestEncoding(
            uploadedFiles,
            uploadedResources,
            uploadedEncodings,
            uploadedTitles,
            accountId,
          );

          // 인코딩 그룹 토스트 알림
          if (uploadedResources.length == 1) {
            window.electron.encodingComplete(
              `${uploadedResources[0].fileTitle} 파일`,
            );
          } else if (uploadedResources.length > 1) {
            window.electron.encodingComplete(
              `${uploadedResources[0].fileTitle} 등 ${uploadedResources.length}개 파일`,
            );
          }
        } else {
          console.log('청크 업로드 미완료');
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="mr-10">
      <Modal
        isOpen={isModalOpen}
        title="Error"
        message={modalMessage}
        onClose={() => setIsModalOpen(false)}
      />
      <br />
      <h2>파일 업로드</h2>
      <br />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full p-4 border-2 border-dashed border-gray-400 rounded-md relative cursor-pointer min-h-64"
        onClick={handleAreaClick}
      >
        {files.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            파일 첨부 영역
          </p>
        )}
        <div className="p-10">
          {files.map((file, fileIndex) => {
            return (
              <FileItem
                key={fileIndex}
                file={file}
                fileIndex={fileIndex}
                filePreview={filePreview[fileIndex]}
                titles={titles}
                encodings={encodings}
                handleTitleChange={handleTitleChange}
                handleFormatChange={handleFormatChange}
                handleResolutionChange={handleResolutionChange}
                addEncoding={addEncoding}
                removeEncoding={removeEncoding}
                handleFileDelete={handleFileDelete}
              />
            );
          })}
        </div>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
      </div>
      <br />
      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={titleVerification}
      >
        Upload
      </button>
    </div>
  );
}

export default UploadComponent;
