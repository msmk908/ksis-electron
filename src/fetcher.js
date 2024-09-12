import axios from 'axios';

const fetcher = axios.create({
  // baseURL: 'http://localhost:8080',
  baseURL: 'http://125.6.38.247/api',
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
      console.log('에러났습니다. 왜냐하면 액세스 토큰이 만료됐거든요.');

      const { data } = error.response;
      console.log('received data :', data);

      const accessToken = localStorage.getItem('accessToken'); // 만료된 액세스 토큰 담기
      console.log('accessToken : ', accessToken);
      if (accessToken) {
        // 만료된 액세스 토큰 갱신 요청
        const response = await fetcher.post(`/get-token`, null, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 토큰을 Authorization 헤더에 담기
          },
        });
        console.log('received response :', response);

        // 리프레시 토큰이 만료된 경우
        if (!response.data) {
          console.log('에러났습니다. 리프레시토큰도 만료됐거든요');
          localStorage.removeItem('accessToken');
          // 로그인 페이지 전환필요
          return Promise.resolve();
        }

        const { accessToken: newAccessToken } = response.data;

        // 갱신된 액세스 토큰 저장
        localStorage.setItem('accessToken', newAccessToken);

        // 갱신된 액세스 토큰으로 재요청
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  },
);

export default fetcher;
