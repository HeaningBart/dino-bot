import { Worker } from 'bullmq'
import path from 'path'

const processorFile = path.join(__dirname, 'processor.js')
console.log(processorFile)
export const worker = new Worker('bot_raws', processorFile)
