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
      setError(
        error.response?.data || '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        id="login-form"
        className="flex flex-col items-center w-full max-w-md bg-white p-8 rounded-lg shadow-lg"
        onSubmit={handleSubmit}
      >
        <h1 className="text-orange-500 mb-6 text-4xl font-semibold text-center">
          로그인
        </h1>

        <div className="form-row w-full mb-5">
          <label
            htmlFor="accountId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            아이디
          </label>
          <input
            type="text"
            id="accountId"
            className="w-full py-3 px-4 border border-orange-400 rounded-lg shadow-sm text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value.toLowerCase())}
            required
          />
        </div>

        <div className="form-row w-full mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            className="w-full py-3 px-4 border border-orange-400 rounded-lg shadow-sm text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <button
          type="submit"
          className="w-full py-3 bg-orange-400 text-white rounded-lg shadow-md text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-500 hover:shadow-lg"
        >
          로그인
        </button>
      </form>
    </div>
  );
};

export default Login;
