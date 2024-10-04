import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetcher from '../fetcher';
import { ACCESS_LOG, LOGIN } from '../constants/api_constant';
import { UPLOAD } from '../constants/page_constant';

const Login = () => {
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const credentials = { accountId, password };
  const WEB_BASE_URL = window.env.WEB_BASE_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetcher.post(LOGIN, credentials);
      const data = response.data;
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('accountId', accountId);
        // alert('Login successful');
        navigate(UPLOAD);

        const url = `${WEB_BASE_URL}/get-token?accessToken=${encodeURIComponent(data.accessToken)}`;
        window.electron.ipcRenderer.invoke('open-url', url);
        try {
          await fetcher.post(ACCESS_LOG, {
            accountId: accountId,
            category: 'LOGIN',
          });
        } catch (logError) {
          console.error('Failed to send access log:', logError);
        }
      } else {
        setError('아이디 또는 비밀번호가 일치하지 않습니다');
      }
    } catch (error) {
      await window.electron.ipcRenderer.invoke('show-error-dialog', {
        title: '네트워크 오류',
        message: '로그인 중 오류가 발생했습니다.'
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-orange-100">
      <form
        id="login-form"
        className="flex flex-col items-center w-11/12 max-w-md"
        onSubmit={handleSubmit}
      >
        <h1 className="text-black mb-5 text-4xl text-center">로그인</h1>
        <div className="form-row flex items-center mb-4 w-full">
          <div className="bg-orange-300 text-black py-2 px-4 rounded-l-md font-bold text-base w-1/3 text-center">
            아이디
          </div>
          <input
            type="text"
            id="accountId"
            className="py-2 px-4 border border-orange-400 rounded-r-md text-base flex-1 text-black placeholder-orange-500"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
        </div>
        <div className="form-row flex items-center mb-4 w-full">
          <div className="bg-orange-300 text-black py-2 px-4 rounded-l-md font-bold text-base w-1/3 text-center">
            비밀번호
          </div>
          <input
            type="password"
            id="password"
            className="py-2 px-4 border border-orange-500 rounded-r-md text-base flex-1 text-black placeholder-orange-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="text-red-600 mb-4">{error}</div> // 오류 메시지 표시
        )}
        <button
          type="submit"
          className="mt-5 w-full py-2 bg-orange-300 text-black border-none rounded-md text-base cursor-pointer transition-colors duration-300 hover:bg-orange-600"
        >
          로그인
        </button>
      </form>
    </div>
  );
};

export default Login;
