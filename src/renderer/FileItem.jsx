import React from 'react';

// 상위로 파일첨부 이벤트 전파를 막음
const handleClick = (e) => {
  e.stopPropagation();
};

// 개별 파일 항목 컴포넌트
const FileItem = ({
  file,
  fileIndex,
  filePreview,
  titles,
  encodings,
  handleTitleChange,
  handleFormatChange,
  handleResolutionChange,
  addEncoding,
  removeEncoding,
  handleFileDelete,
}) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <div
      className="relative border p-4 mt-4 mb-4 rounded-md shadow-sm flex"
      onClick={handleClick}
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
            src={filePreview}
            alt={file.name}
            className="w-full h-auto object-cover"
          />
        ) : isVideo ? (
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
          value={titles[fileIndex] || ''}
          onChange={(e) => handleTitleChange(fileIndex, e.target.value)}
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
                    onClick={() => removeEncoding(fileIndex, encodingIndex)}
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
};

export default FileItem;
