// const os = require('os');

// function getLocalIP() {
//   const interfaces = os.networkInterfaces();
//   for (const name of Object.keys(interfaces)) {
//     for (const iface of interfaces[name]) {
//       // 내부 IP 주소만 확인 (IPv4, 내부 주소가 아니어야 함)
//       if (iface.family === 'IPv4' && !iface.internal) {
//         return iface.address;
//       }
//     }
//   }
//   return 'IP not found';
// }

// export default getLocalIP;
