const api = window.api;

export const videoService = {
  async extractInfo(url) {
    try {
      return await api.extractInfo(url);
    } catch (error) {
      throw error?.message || 'Failed to extract video info';
    }
  },

  chooseFolder() {
    return api.chooseFolder();
  },

  download(opts) {
    return api.download(opts);
  },

  onProgress(callback) {
    return api.onProgress(callback);
  },

  openInFolder(target) {
    return api.openPath(target);
  },
};
