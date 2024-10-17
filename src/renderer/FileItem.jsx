import React, { useState, useEffect } from 'react';
import fetcher from '../fetcher';
import { RESOLUTION } from '../constants/api_constant';
import { Select } from './catalyst/select';

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
  const [resolutions, setResolutions] = useState([]);

  useEffect(() => {
    const fetchResolutions = async () => {
      try {
        const response = await fetcher.get(RESOLUTION);
        setResolutions(response.data);
        // 초기값 설정: 첫 번째 해상도를 기본값으로 설정
        if (response.data.length > 0) {
          const initialResolution = `${response.data[0].width}x${response.data[0].height}`;
          handleResolutionChange(fileIndex, 0, {
            target: { value: initialResolution },
          });
        }
      } catch (error) {
        console.error('Failed to fetch resolutions:', error);
      }
    };

    fetchResolutions();
  }, []);

  // 파일 이름을 제한된 길이로 줄이는 함수
  const truncateFileName = (name, maxLength) => {
    if (name.length > maxLength) {
      return name.slice(0, maxLength) + '...';
    }
    return name;
  };

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
        <label
          className="block mb-2 font-bold overflow-hidden text-ellipsis whitespace-nowrap"
          title={file.name} // 마우스를 올리면 전체 파일 이름 표시
        >
          {truncateFileName(file.name, 25)} {/* 25자로 파일 이름을 제한 */}
        </label>
        <input
          type="text"
          placeholder="제목을 입력해주세요."
          className="p-2 border rounded-md w-full mb-4"
          value={titles[fileIndex] || ''}
          onChange={(e) => handleTitleChange(fileIndex, e.target.value)}
        />

        {encodings[fileIndex]?.map((encoding, encodingIndex) => (
          <div key={encodingIndex} className="flex space-x-4 mb-4">
            <div className="w-auto">
              <Select
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
                    <option value="AAA">AAA</option>
                  </>
                ) : (
                  <>
                    <option value="mp4">MP4</option>
                    <option value="mov">MOV</option>
                    <option value="avi">AVI</option>
                    <option value="mkv">MKV</option>
                  </>
                )}
              </Select>
            </div>

            <div className="w-auto">
              <Select
                value={encoding.resolution}
                onChange={(e) =>
                  handleResolutionChange(fileIndex, encodingIndex, e)
                }
              >
                {resolutions.map((res) => (
                  <option
                    key={res.resolutionId}
                    value={`${res.width}x${res.height}`}
                  >
                    {`${res.width}x${res.height}`}
                  </option>
                ))}
              </Select>
            </div>

            {encodingIndex === encodings[fileIndex].length - 1 && (
              <>
                <div className="w-auto">
                  <button
                    className="bg-blue-500 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center"
                    onClick={() => addEncoding(fileIndex)}
                  >
                    +
                  </button>
                </div>

                <div className="w-auto">
                  <button
                    className="bg-red-500 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center"
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
