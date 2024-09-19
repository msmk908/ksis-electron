import React, { useState, useRef } from 'react';

// 개별 파일 항목 컴포넌트
const FileItem = React.memo(
  ({ file, index, onDelete, filePreview, onTitleChange }) => {
    // 상위로 파일첨부 이벤트 전파를 막음
    const handleClick = (e) => {
      e.stopPropagation();
    };

    // 제목 입력 시 UploadComponent에 알림
    const handleInputChange = (e) => {
      onTitleChange(index, e.target.value);
    };

    return (
      <div
        className="relative border p-4 mt-4 mb-4 rounded-md shadow-sm flex"
        onClick={handleClick}
      >
        <button
          onClick={() => onDelete(index)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          &times;
        </button>
        <div className="w-1/2 pr-4">
          {file.type.startsWith('image/') ? (
            <img
              src={filePreview}
              alt={file.name}
              className="w-full h-auto object-cover"
            />
          ) : file.type.startsWith('video/') ? (
            <video
              src={filePreview}
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
            conChange={handleInputChange} // 제목 입력 시 호출
          />
        </div>
      </div>
    );
  },
);

export default FileItem;
