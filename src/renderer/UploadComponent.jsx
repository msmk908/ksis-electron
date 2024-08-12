// src/UploadComponent.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css'; // 테일윈드 css 적용

function UploadComponent() {
  const [files, setFiles] = useState([]); // 첨부한 파일 저장
  const [titles, setTitles] = useState({}); // 파일 제목 저장
  const [formats, setFormats] = useState({}); // 파일 포맷 저장
  const [resolutions, setResolutions] = useState({}); // 파일 해상도 저장
  const [uploadStatus, setUploadStatus] = useState(''); // 업로드 상태
  const fileInputRef = useRef(null); // 파일첨부 기능

  const CHUNK_SIZE = 1024 * 1024; // 청크 사이즈 1MB

  // 첨부한 파일 컨트롤
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  // 드롭으로 파일 컨트롤
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  // 드래그 할 때 기본 기능 비활성화
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 파일 제목 컨트롤
  const handleTitleChange = (index, e) => {
    const newTitles = { ...titles, [index]: e.target.value };
    setTitles(newTitles);
  };

  // 파일 포맷 컨트롤
  const handleFormatChange = (index, e) => {
    const newFormats = { ...formats, [index]: e.target.value };
    setFormats(newFormats);
  };

  // 파일 해상도 컨트롤
  const handleResolutionChange = (index, e) => {
    const newResolutions = { ...resolutions, [index]: e.target.value };
    setResolutions(newResolutions);
  };

  // 클릭 시 파일 선택창 열기
  const handleAreaClick = () => {
    fileInputRef.current.click();
  };

  // 첨부한 파일 클릭 시 선택창 열기 비활성화
  const handleChildClick = (e) => {
    e.stopPropagation();
  };

  // 메타데이터를 서버에 전송
  const sendFileMetadata = async (file, title, resolution) => {
    const formData = {
      filename: file.name,
      title: title,
      format: `${file.name.split('.').pop()}`,
      resolution: resolution || '1080p',
      fileSize: file.size,
      status: 'UPLOADING', // 초기 상태를 UPLOADING으로 설정
    };

    try {
      await axios.post('http://localhost:8080/api/upload-metadata', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending file metadata:', error);
      throw error;
    }
  };

  // 청크 업로드 엔드포인트
  const uploadChunk = async (chunk, index, totalChunks, filename) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', index);
    formData.append('totalChunks', totalChunks);
    formData.append('filename', filename);

    try {
      await axios.post('http://localhost:8080/api/upload-chunk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error(`Error uploading chunk ${index}:`, error);
      throw error;
    }
  };

  // 파일 정보를 청크 업로드로 넘겨주는 메서드
  const uploadFile = async (file, title, format, resolution) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileExtension = file.name.split('.').pop(); // 확장자 추출
    const filename = title ? `${title}.${fileExtension}` : file.name; // 제목과 확장자 결합

    try {
      // 메타데이터 전송
      await sendFileMetadata(file, title, resolution);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(chunk, i, totalChunks, filename);
      }

      return { file, title, format, resolution };
    } catch (error) {
      console.error(`Error uploading file ${filename}:`, error);
      throw error;
    }
  };

  // 업로드 파일 상태 업데이트
  const updateFileStatus = async (title, status) => {
    try {
      await axios.post('http://localhost:8080/api/update-file', {
        title: title,
        status: status,
      });
    } catch (error) {
      console.error(`Error updating file status:`, error);
    }
  };

  // 업로드 버튼 클릭 메서드
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('No file selected.');
      return;
    }

    setUploadStatus('Uploading...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // title이 없을 경우 file.name에서 확장자를 제거한 값으로 설정
        const fileNameWithoutExtension = file.name
          .split('.')
          .slice(0, -1)
          .join('.');
        const title = titles[i] || fileNameWithoutExtension;
        const format = formats[i];
        const resolution = resolutions[i];
        const metadata = await uploadFile(file, title, format, resolution);

        if (metadata) {
          // 업로드 완료 후 상태 업데이트
          await updateFileStatus(metadata.title, 'COMPLETED');
        }
      }

      setUploadStatus('File uploaded successfully!');
    } catch (error) {
      setUploadStatus('Error uploading file.');
      console.error('Error:', error);

      // 업로드 실패 시 상태 업데이트
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const title = titles[i];

        const filename = `${title || file.name}.${file.name.split('.').pop()}`;
        await updateFileStatus(filename, 'FAIL'); // 실패 시 상태를 FAIL로 업데이트
      }
    }
  };

  return (
    <div>
      <h2>파일 업로드</h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="p-4 border-2 border-dashed border-gray-400 rounded-md relative cursor-pointer"
        onClick={handleAreaClick} // 업로드 영역 클릭 시 파일 선택창 열기
      >
        {/* 파일이 없는 경우 문구를 중앙에 표시 */}
        {files.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            파일 첨부 영역
          </p>
        )}

        <div className="p-10">
          {files.map((file, index) => (
            <div
              key={index}
              className="border p-4 mt-4 mb-4 rounded-md shadow-sm flex"
              onClick={handleChildClick}
            >
              {/* 왼쪽: 이미지 미리보기 */}
              <div className="w-1/2 pr-4">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* 오른쪽: 제목, 포맷, 해상도 설정 */}
              <div className="w-1/2 pr-4">
                <label className="block mb-2 font-bold">{file.name}</label>
                <input
                  type="text"
                  placeholder="제목을 입력해주세요."
                  className="p-2 border rounded-md w-full mb-4"
                  value={titles[index] || ''}
                  onChange={(e) => handleTitleChange(index, e)}
                />

                <div className="mb-4">
                  <select
                    className="p-2 border rounded-md w-full"
                    value={formats[index] || 'jpg'}
                    onChange={(e) => handleFormatChange(index, e)}
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>

                <div className="mb-4">
                  <select
                    className="p-2 border rounded-md w-full"
                    value={resolutions[index] || '1080p'}
                    onChange={(e) => handleResolutionChange(index, e)}
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden" // 파일 선택 버튼 숨기기
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
