import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ksisLogo from '../../assets/logo/ksis-logo.png';
import fetcher from '../fetcher';
import { MAC } from '../constants/api_constant';
import { LOGIN } from '../constants/page_constant';

const Mac = () => {
  const [macAddress, setMacAddress] = useState(null);
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 훅

  const handleLogin = async () => {
    let mac;
    try {
      // 로그인 버튼을 눌렀을 때 MAC 주소 가져오기
      mac = await window.electron.getMacAddress();
      setMacAddress(mac);

      if (!mac) {
        alert('MAC 주소를 가져올 수 없습니다.');
        return;
      }

      // MAC 주소를 서버로 전송하여 검증 요청
      const response = await fetcher.post(MAC, { mac });

      // 서버로부터 받은 메시지에 따라 행동 결정
      if (response.data.success) {
        navigate(LOGIN);
      }
    } catch (error) {
      // HTTP 응답에서 메시지 읽기
      if (error.response) {
        // 서버가 응답을 했지만 성공하지 않은 상태 코드 (4xx, 5xx)
        alert(error.response.data.message);
      } else {
        // 서버 응답이 없거나, 다른 네트워크 오류 발생
        console.error('Error during MAC address validation:', error);
        alert('로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <img src={ksisLogo} alt="KSIS Logo" className="mb-8 w-40 h-auto" />

      <button
        onClick={handleLogin}
        className="py-3 px-20 bg-orange-400 text-white rounded-lg shadow-md text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-500 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300"
      >
        로그인 하러가기
      </button>
    </div>
  );
};

export default Mac;
