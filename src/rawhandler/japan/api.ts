import axios from 'axios'

const vpn_user = process.env.vpn_user!
const vpn_password = process.env.vpn_password!

function createPyccomaAPI() {
  const api = axios.create({
    proxy: {
      host: 'jp547.nordvpn.com',
      port: 89,
      auth: {
        username: vpn_user,
        password: vpn_password,
      },
      protocol: 'https',
    },
  })
  return api
}
