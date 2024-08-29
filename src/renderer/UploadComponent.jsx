import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { useNavigate } from 'react-router-dom';

function UploadComponent() {
  const [files, setFiles] = useState([]); // 첨부한 파일 저장
  const [titles, setTitles] = useState({}); // 파일 제목 저장
  const [encodings, setEncodings] = useState({}); // 파일 인코딩 설정 저장
  const [resolutions, setResolutions] = useState({}); // 원본 해상도 저장
  const [uploadStatus, setUploadStatus] = useState(''); // 업로드 상태
  const fileInputRef = useRef(null); // 파일첨부 기능
  const navigate = useNavigate(); // 네비게이트 훅 사용
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB로 청크 사이즈 설정

  // 첨부파일 추가 메서드
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
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

      return updatedFiles;
    });
  };

  // 드래그 드롭 메서드
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newFiles = Array.from(e.dataTransfer.files);
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

      return updatedFiles;
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 제목 설정
  const handleTitleChange = (index, e) => {
    const newTitles = { ...titles, [index]: e.target.value };
    setTitles(newTitles);
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
  const addEncoding = (fileIndex) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex] = [
      ...newEncodings[fileIndex],
      { format: encodings[fileIndex][0].format, resolution: '1080p' }, // 동일한 포맷으로 추가
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

  const handleChildClick = (e) => {
    e.stopPropagation();
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

  // 메타데이터 저장 함수
  const saveMetadata = async (files, titles, resolutions) => {
    const formData = new FormData();
    const dtos = [];

    await Promise.all(
      files.map(async (file, index) => {
        // 원본 파일의 확장자 추출 (확장자에서 . 제거)
        const format = file.name.split('.').pop().toLowerCase();
        // 파일 제목 설정 (제목이 없는 경우 파일 이름을 사용)
        const fileTitle =
          titles[index] || file.name.split('.').slice(0, -1).join('.');
        // 해상도 문자열 생성
        const resolution = `${resolutions[index]?.width || ''}x${resolutions[index]?.height || ''}`;
        // 재생시간
        const playTime = resolutions[index].playtime || '0';
        // 파일 타입
        const resourceType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';

        // 로컬스토리지에 업로드할 파일미리보기, 업로드 진행률 0%로 저장
        localStorage.setItem(
          `uploadProgress_${fileTitle}`,
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

    return axios.post('http://localhost:8080/api/filedatasave', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  // 청크 업로드 함수
  const uploadChunks = async (file, savedResource, fileTitle) => {
    const uuidFileName = savedResource.filename;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const chunkProgress = Array.from({ length: totalChunks }, (_, idx) => ({
      chunkIndex: idx,
      status: 'PENDING',
    }));

    localStorage.setItem(
      `chunkProgress_${fileTitle}`,
      JSON.stringify(chunkProgress),
    );

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('file', chunk);
      chunkFormData.append('fileName', uuidFileName);
      chunkFormData.append('chunkIndex', chunkIndex);
      chunkFormData.append('totalChunks', totalChunks);

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
                ((chunkIndex * CHUNK_SIZE + progressEvent.loaded) / file.size) *
                  100,
              ),
            );

            const existingData =
              JSON.parse(localStorage.getItem(`uploadProgress_${fileTitle}`)) ||
              {};
            localStorage.setItem(
              `uploadProgress_${fileTitle}`,
              JSON.stringify({ ...existingData, progress: percentCompleted }),
            );

            const chunkProgress = JSON.parse(
              localStorage.getItem(`chunkProgress_${fileTitle}`),
            );
            chunkProgress[chunkIndex].status = 'UPLOADED';
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
    }
  };

  // 인코딩 요청 함수
  const requestEncoding = async (files, savedResources, encodings, titles) => {
    const encodingsWithFileNames = files.reduce((acc, file, index) => {
      acc[savedResources[index].filename] = {
        encodings: encodings[index],
        title: titles[index] || file.name.split('.').slice(0, -1).join('.'),
      };
      return acc;
    }, {});

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

  // 업로드 버튼 함수 리팩토링
  const handleUpload = async () => {
    window.alert('업로드를 진행합니다. 진행 상황 페이지로 이동합니다.');
    navigate('/uploadProgress');

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

        // 청크 업로드 진행
        for (let i = 0; i < savedResources.length; i++) {
          const file = files[i];
          const fileTitle =
            titles[i] || file.name.split('.').slice(0, -1).join('.');
          await uploadChunks(file, savedResources[i], fileTitle);
        }

        // 인코딩 요청
        await requestEncoding(files, savedResources, encodings, titles);

        setUploadStatus('업로드가 완료되었습니다.');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div>
      <h2>파일 업로드</h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="p-4 border-2 border-dashed border-gray-400 rounded-md relative cursor-pointer"
        onClick={handleAreaClick}
      >
        {files.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            파일 첨부 영역
          </p>
        )}

        <div className="p-10">
          {files.map((file, fileIndex) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const fileUrl = URL.createObjectURL(file); // 파일의 URL 생성

            return (
              <div
                key={fileIndex}
                className="relative border p-4 mt-4 mb-4 rounded-md shadow-sm flex"
                onClick={handleChildClick}
              >
                <button
                  onClick={() => handleFileDelete(fileIndex)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
                <div className="w-1/2 pr-4">
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt={file.name}
                      className="w-full h-auto object-cover"
                    />
                  ) : isVideo ? (
                    <video
                      src={fileUrl}
                      className="w-full h-auto object-cover"
                      controls
                    />
                  ) : (
                    <p>미리보기 불가</p>
                  )}
                </div>

                <div className="w-1/2 pr-4">
                  <label className="block mb-2 font-bold">{file.name}</label>
                  <input
                    type="text"
                    placeholder="제목을 입력해주세요."
                    className="p-2 border rounded-md w-full mb-4"
                    value={titles[fileIndex] || ''}
                    onChange={(e) => handleTitleChange(fileIndex, e)}
                  />

                  {encodings[fileIndex]?.map((encoding, encodingIndex) => (
                    <div key={encodingIndex} className="flex space-x-4 mb-4">
                      <div className="w-1/4">
                        <select
                          className="p-2 border rounded-md w-full"
                          value={encoding.format}
                          onChange={(e) =>
                            handleFormatChange(fileIndex, encodingIndex, e)
                          }
                        >
                          {isImage ? (
                            <>
                              <option value="png">PNG</option>
                              <option value="jpg">JPG</option>
                              <option value="bmp">BMP</option>
                            </>
                          ) : (
                            <>
                              <option value="mp4">MP4</option>
                              <option value="mov">MOV</option>
                              <option value="avi">AVI</option>
                              <option value="mkv">MKV</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="w-1/4">
                        <select
                          className="p-2 border rounded-md w-full"
                          value={encoding.resolution}
                          onChange={(e) =>
                            handleResolutionChange(fileIndex, encodingIndex, e)
                          }
                        >
                          <option value="720p">720p</option>
                          <option value="1080p">1080p</option>
                          <option value="4k">4K</option>
                        </select>
                      </div>

                      {encodingIndex === encodings[fileIndex].length - 1 && (
                        <>
                          <div className="w-1/4">
                            <button
                              className="w-full p-2 bg-blue-500 text-white rounded"
                              onClick={() => addEncoding(fileIndex)}
                            >
                              +
                            </button>
                          </div>

                          <div className="w-1/4">
                            <button
                              className="w-full p-2 bg-red-500 text-white rounded"
                              onClick={() =>
                                removeEncoding(fileIndex, encodingIndex)
                              }
                              disabled={encodings[fileIndex].length <= 1}
                            >
                              -
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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

      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={handleUpload}
      >
        Upload
      </button>
      <p>{uploadStatus}</p>
    </div>
  );
}

export default UploadComponent;
