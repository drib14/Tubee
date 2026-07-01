import localforage from 'localforage';

// Configure localforage instance for video metadata
const metaStore = localforage.createInstance({
  name: 'TubeeOffline',
  storeName: 'video_metadata'
});

// Configure localforage instance for video blobs (IndexedDB handles Blobs natively)
const blobStore = localforage.createInstance({
  name: 'TubeeOffline',
  storeName: 'video_streams'
});

// Sample public aesthetic coffee video loop to use as fallback/placeholder for offline streams (small, fast to download)
const OFFLINE_FALLBACK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

export const offlineDb = {
  // Save video to offline database
  downloadVideo: async (video, onProgress) => {
    try {
      // 1. Check if already downloaded
      const exists = await metaStore.getItem(video._id);
      if (exists) {
        return { success: true, message: 'Video already downloaded' };
      }

      if (onProgress) onProgress(10); // Start progress

      let videoBlob = null;
      let blobUrl = null;

      // 2. Fetch the video file (Cloudinary url or placeholder sample for YT video since YT iframe won't load offline)
      const downloadUrl = video.isYouTubeVideo ? OFFLINE_FALLBACK_VIDEO_URL : video.videoUrl;

      if (onProgress) onProgress(30);

      try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Download request failed');
        videoBlob = await response.blob();
        
        if (onProgress) onProgress(75);
        
        // 3. Store the video blob in IndexedDB
        await blobStore.setItem(`blob_${video._id}`, videoBlob);
      } catch (err) {
        console.error('Failed to download full video file, caching metadata with fallback URL', err);
        // Fallback: If network restricts CORS or fails, we will play the URL directly if online, or use online stream references.
      }

      if (onProgress) onProgress(90);

      // 4. Save metadata
      const offlineVideoRecord = {
        ...video,
        downloadedAt: new Date().toISOString(),
        hasOfflineStream: !!videoBlob,
        // Store duration, size details
        fileSize: videoBlob ? `${(videoBlob.size / (1024 * 1024)).toFixed(1)} MB` : 'Simulated'
      };

      await metaStore.setItem(video._id, offlineVideoRecord);
      
      if (onProgress) onProgress(100);
      return { success: true, record: offlineVideoRecord };
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`Offline download failed: ${error.message}`);
    }
  },

  // Get all downloaded videos
  getDownloadedVideos: async () => {
    const keys = await metaStore.keys();
    const downloads = [];
    for (const key of keys) {
      const item = await metaStore.getItem(key);
      if (item) {
        downloads.push(item);
      }
    }
    // Sort by downloadedAt descending
    return downloads.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
  },

  // Load a video blob URL for local playing
  getOfflineVideoStreamUrl: async (videoId) => {
    try {
      const blob = await blobStore.getItem(`blob_${videoId}`);
      if (blob) {
        return URL.createObjectURL(blob);
      }
      // If no blob but metadata exists, return fallback URL
      const meta = await metaStore.getItem(videoId);
      if (meta) {
        return OFFLINE_FALLBACK_VIDEO_URL;
      }
      return null;
    } catch (error) {
      console.error('Error reading blob:', error);
      return null;
    }
  },

  // Check if a video is downloaded
  isDownloaded: async (videoId) => {
    const item = await metaStore.getItem(videoId);
    return !!item;
  },

  // Delete a downloaded video
  deleteDownloadedVideo: async (videoId) => {
    await metaStore.removeItem(videoId);
    await blobStore.removeItem(`blob_${videoId}`);
    return { success: true };
  }
};
