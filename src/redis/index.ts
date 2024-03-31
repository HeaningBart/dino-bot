import Redis from 'ioredis'

const redis = new Redis({
  db: 1,
  reconnectOnError: () => false,
})

redis.on('connection', () => {
  console.log('Redis conectando...')
})

redis.on('end', async () => {
  console.log('Redis saindo...')
})

redis.on('close', async () => {
  console.log('Redis saindo...')
})

export { redis }
