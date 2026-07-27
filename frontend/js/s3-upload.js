// Amazon S3 Asset Upload Helper for Frontend UI
class S3Uploader {
  static async uploadFile(file, folder = 'assets', onProgress = null) {
    if (!file) return null;

    try {
      console.log(`[S3 Uploading] Starting upload for ${file.name} to AWS S3 folder "${folder}"...`);
      const response = await APIClient.uploadAssetToS3(file, folder);
      console.log(`[S3 Upload Complete] Asset saved to Amazon S3: ${response.s3Url}`);
      return response.s3Url;
    } catch (err) {
      console.error('[S3 Upload Error] Direct upload failed, falling back to data URL:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  }
}

window.S3Uploader = S3Uploader;
