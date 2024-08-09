// src/UploadComponent.jsx
import React, { useState } from 'react';
import axios from 'axios';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const CHUNK_SIZE = 1024 * 1024; // 1MB

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('No file selected.');
      return;
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const filename = file.name;

    setUploadStatus('Uploading...');

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(chunk, i, totalChunks, filename);
      }
      setUploadStatus('File uploaded successfully!');
    } catch (error) {
      setUploadStatus('Error uploading file.');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h2>Upload a File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{uploadStatus}</p>
    </div>
  );
}

export default UploadComponent;
