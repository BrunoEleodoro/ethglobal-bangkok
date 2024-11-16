import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadBase64File(base64Data: string, fileName: string, contentType: string) {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:.*?;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    };

    const command = new PutObjectCommand({...params,
        ACL: 'public-read'
    });
    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return fileUrl;

  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}
