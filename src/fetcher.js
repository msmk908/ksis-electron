import axios from 'axios';
import { TOKEN_CALLBACK } from './constants/api_constant';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_BASE_URL = window.env.API_BASE_URL;

const fetcher = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
});

fetcher.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;  
  },
  (error) => {
    return Promise.reject(error);
  },
);

fetcher.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 403) {
      console.log('액세스 토큰 만료');

      const { data } = error.response;
      const accessToken = localStorage.getItem('accessToken'); // 만료된 액세스 토큰 담기
     
      if (accessToken) {
        // 만료된 액세스 토큰 갱신 요청
        const response = await fetcher.post(TOKEN_CALLBACK, null, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 토큰을 Authorization 헤더에 담기
          },
        });

        // 리프레시 토큰이 만료된 경우
        if (!response.data) {
          console.log('리프레시 토큰 만료');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return Promise.resolve();
        }
        const { accessToken: newAccessToken } = response.data;

        // 갱신된 액세스 토큰 저장
        localStorage.setItem('accessToken', newAccessToken);
        console.log('액세스 토큰 갱신');
        // 갱신된 액세스 토큰으로 재요청
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(error.config);
      }
      return Promise.resolve();
    }
    return Promise.reject(error);
  },
);

export default fetcher;
