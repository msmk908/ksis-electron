// src/UploadComponent.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css'; // 테일윈드 css 적용

function UploadComponent() {
  const [files, setFiles] = useState([]); // 첨부한 파일 저장
  const [titles, setTitles] = useState({}); // 파일 제목 저장
  const [encodings, setEncodings] = useState({}); // 파일 인코딩 설정 저장
  const [uploadStatus, setUploadStatus] = useState(''); // 업로드 상태
  const fileInputRef = useRef(null); // 파일첨부 기능

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...newFiles];

      // 새 파일에 대해 기본 인코딩 설정 추가
      newFiles.forEach((_, index) => {
        setEncodings((prevEncodings) => ({
          ...prevEncodings,
          [prevFiles.length + index]: [{ format: 'jpg', resolution: '1080p' }],
        }));
      });

      return updatedFiles;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newFiles = Array.from(e.dataTransfer.files);

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...newFiles];

      // 새 파일에 대해 기본 인코딩 설정 추가
      newFiles.forEach((_, index) => {
        setEncodings((prevEncodings) => ({
          ...prevEncodings,
          [prevFiles.length + index]: [{ format: 'jpg', resolution: '1080p' }],
        }));
      });

      return updatedFiles;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleTitleChange = (index, e) => {
    const newTitles = { ...titles, [index]: e.target.value };
    setTitles(newTitles);
  };

  const handleFormatChange = (fileIndex, encodingIndex, e) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex][encodingIndex].format = e.target.value;
    setEncodings(newEncodings);
  };

  const handleResolutionChange = (fileIndex, encodingIndex, e) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex][encodingIndex].resolution = e.target.value;
    setEncodings(newEncodings);
  };

  const addEncoding = (fileIndex) => {
    const newEncodings = { ...encodings };
    newEncodings[fileIndex] = [
      ...newEncodings[fileIndex],
      { format: 'jpg', resolution: '1080p' },
    ];
    setEncodings(newEncodings);
  };

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

  const handleUpload = (e) => {
    // 여기에 파일 업로드 로직을 추가하세요
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
          {files.map((file, fileIndex) => (
            <div
              key={fileIndex}
              className="border p-4 mt-4 mb-4 rounded-md shadow-sm flex"
              onClick={handleChildClick}
            >
              <div className="w-1/2 pr-4">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-auto object-cover"
                />
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

                {encodings[fileIndex].map((encoding, encodingIndex) => (
                  <div key={encodingIndex} className="flex space-x-4 mb-4">
                    <div className="w-1/4">
                      <select
                        className="p-2 border rounded-md w-full"
                        value={encoding.format}
                        onChange={(e) =>
                          handleFormatChange(fileIndex, encodingIndex, e)
                        }
                      >
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="gif">GIF</option>
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
                        onClick={() => removeEncoding(fileIndex, encodingIndex)}
                        disabled={encodings[fileIndex].length <= 1}
                      >
                        -
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
