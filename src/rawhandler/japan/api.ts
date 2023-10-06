import axios from "axios";
const {
  jp_login,
  jp_pwd,
  vpn_user,
  vpn_password,
  vpn_url,
} = require("../../../config.json");

function createPyccomaAPI() {
  const api = axios.create({
    proxy: {
      host: "jp547.nordvpn.com",
      port: 89,
      auth: {
        username: vpn_user,
        password: vpn_password,
      },
      protocol: "https",
    },
  });
  return api;
}
