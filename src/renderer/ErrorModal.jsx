import React from 'react';

function Modal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center"
      onClick={onClose}
      style={{ zIndex: 1000 }} // z-index 값을 높게 설정하여 모달이 최상단에 보이도록 설정
    >
      <div
        className="bg-white p-5 rounded-lg shadow-lg max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="mb-4">{message}</p>
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 hover:text-gray-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;
