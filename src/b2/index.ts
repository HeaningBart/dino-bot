import { S3, S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
const { accessKeyId, secretAccessKey, bucketName, endpoint, region, cdn } = require('../../config.json')
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs/promises'

const Drive = new S3({
    endpoint: endpoint,
    region: region,
    credentials: {
        accessKeyId,
        secretAccessKey
    },
})


const expiresIn = 60 * 60 * 24 * 3


export async function uploadFile(filename: string, buffer: Buffer) {
    await Drive.putObject({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: 'application/zip',
    })
    console.log('Upload done - ' + filename);
}

// const SignedClient = new S3Client({
//     endpoint,
//     region,
//     credentials: {
//         accessKeyId,
//         secretAccessKey
//     }
// })

export function getUrl(key: string): string {
    return `${cdn}/file/${bucketName}/${key}`;
}


export async function getEncryptedUrl(key: string) {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    })
    const data = await getSignedUrl(Drive, command, { expiresIn });
    return data;
}





