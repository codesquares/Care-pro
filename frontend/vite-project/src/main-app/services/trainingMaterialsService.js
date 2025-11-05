// Training Materials service for handling training material downloads
import api from './api';

const trainingMaterialsService = {
  /**
   * Gets available training materials for the specified user type
   * @param {string} userType - The type of user (Caregiver, Client)
   * @returns {Promise<Object>} - Response with available training materials
   */
  getTrainingMaterials: async (userType = 'Caregiver') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log(`Fetching training materials for ${userType}...`);
      
      const response = await api.get(
        `/assessments/training-materials/${userType}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        // If API returns array directly, wrap it in success format
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Invalid response format from training materials API');
      }
    } catch (err) {
      console.error('Error fetching training materials:', err);
      throw err;
    }
  },

  /**
   * Gets download URL for a specific training material
   * @param {string} materialId - The ID of the training material
   * @returns {Promise<Object>} - Response with download URL
   */
  getDownloadUrl: async (materialId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (!materialId) {
        throw new Error('Material ID is required');
      }

      console.log(`Getting download URL for material: ${materialId}`);
      
      const response = await api.get(
        `/assessments/training-materials/download/${materialId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (err) {
      console.error('Error getting download URL:', err);
      throw err;
    }
  },

  /**
   * Downloads a training material file using the new direct download endpoint
   * @param {string} materialId - The ID of the training material
   * @param {string} fileName - The name of the file for download (optional fallback)
   * @returns {Promise<Object>} - Download result
   */
  downloadMaterial: async (materialId, fileName = 'training-material') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (!materialId) {
        throw new Error('Material ID is required');
      }

      console.log(`Starting download for material: ${materialId}`);

      // First, try to get file info to get the actual filename and Cloudinary URL
      let fileInfo = null;
      let actualFileName = fileName;
      
      try {
        const infoResponse = await trainingMaterialsService.getDownloadUrl(materialId);
        if (infoResponse.success && infoResponse.data) {
          fileInfo = infoResponse.data;
          actualFileName = fileInfo.fileName || fileName;
          console.log('Got file info:', fileInfo);
        }
      } catch (infoErr) {
        console.warn('Could not get file info, will try direct endpoint:', infoErr);
      }

      // Option 1: Try the new direct download endpoint (primary method)
      try {
        console.log('Attempting new direct download endpoint (backend proxy)...');
        
        const response = await api.get(`/assessments/training-materials/file/${materialId}`, {
          responseType: 'blob',
          headers: { 
            'Accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200 && response.data) {
          const blob = response.data;
          
          // Get content type from response headers for better file handling
          const contentType = response.headers['content-type'] || 'application/octet-stream';
          console.log('Downloaded file content type:', contentType);
          
          // Create blob with proper content type
          const typedBlob = new Blob([blob], { type: contentType });
          const objectUrl = URL.createObjectURL(typedBlob);
          
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = actualFileName;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          
          console.log(`Successfully downloaded: ${actualFileName} via backend proxy`);
          return {
            success: true,
            fileName: actualFileName,
            method: 'backend_proxy',
            contentType: contentType
          };
        }
      } catch (directErr) {
        console.warn('Backend proxy download failed:', directErr);
        
        // If it's a 404, the endpoint might not be available yet
        if (directErr.response?.status === 404) {
          console.log('Backend proxy endpoint not available (404), falling back to Cloudinary URL');
        } else if (directErr.response?.status === 401 || directErr.response?.status === 403) {
          console.log('Authentication failed for backend proxy, falling back to Cloudinary URL');
        } else {
          console.log('Backend proxy failed with error:', directErr.message);
        }
      }

      // Option 2: Fallback to original Cloudinary URL method if we have file info
      if (fileInfo && fileInfo.downloadUrl) {
        console.log('Using Cloudinary URL fallback:', fileInfo.downloadUrl);
        
        // Test the Cloudinary URL accessibility first (use GET with range to minimize data)
        try {
          const testResponse = await fetch(fileInfo.downloadUrl, { 
            method: 'GET',
            headers: { 'Range': 'bytes=0-0' } // Request just first byte to test
          });
          if (testResponse.status === 401) {
            console.warn('Cloudinary URL requires authentication or is private');
            throw new Error('File requires authentication - unable to download directly');
          }
          if (!testResponse.ok && testResponse.status !== 206) { // 206 = Partial Content for range requests
            console.warn('Cloudinary URL test failed:', testResponse.status);
            throw new Error(`File not accessible: ${testResponse.status}`);
          }
        } catch (testErr) {
          console.warn('Cloudinary URL test failed:', testErr.message);
          // Continue anyway, let user try the download
        }
        
        const link = document.createElement('a');
        link.href = fileInfo.downloadUrl;
        link.download = actualFileName;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Successfully downloaded: ${actualFileName} via Cloudinary URL`);
        return {
          success: true,
          fileName: actualFileName,
          downloadUrl: fileInfo.downloadUrl,
          method: 'cloudinary_fallback'
        };
      }

      // Option 3: Simple redirect to backend proxy endpoint
      console.log('Attempting simple backend proxy redirect...');
      const backendProxyUrl = `${api.defaults.baseURL}/assessments/training-materials/file/${materialId}?token=${encodeURIComponent(token)}`;
      window.open(backendProxyUrl, '_blank');
      
      return {
        success: true,
        fileName: actualFileName,
        downloadUrl: backendProxyUrl,
        method: 'backend_proxy_redirect'
      };
      
    } catch (err) {
      console.error('Error downloading material:', err);
      throw err;
    }
  },

  /**
   * Alternative download method using the new backend proxy endpoint
   * @param {string} materialId - The ID of the training material
   * @returns {Promise<Object>} - Download result
   */
  downloadMaterialSimple: async (materialId) => {
    try {
      if (!materialId) {
        throw new Error('Material ID is required');
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Using simple download method with backend proxy...');
      
      // Try the new backend proxy endpoint first
      try {
        const backendProxyUrl = `${api.defaults.baseURL}/assessments/training-materials/file/${materialId}`;
        
        // Try direct navigation to the backend proxy (HEAD method not supported)
        window.location.href = `${backendProxyUrl}?token=${encodeURIComponent(token)}`;
        
        console.log(`Backend proxy download initiated for material: ${materialId}`);
        return {
          success: true,
          materialId: materialId,
          downloadUrl: backendProxyUrl,
          method: 'backend_proxy_simple'
        };
      } catch (proxyErr) {
        console.warn('Backend proxy failed, using original Cloudinary method:', proxyErr);
        
        // Fallback to original Cloudinary URL method
        const downloadResponse = await trainingMaterialsService.getDownloadUrl(materialId);
        
        if (downloadResponse.success && downloadResponse.data.downloadUrl) {
          const downloadUrl = downloadResponse.data.downloadUrl;
          const fileName = downloadResponse.data.fileName || 'training-material';
          
          // Use the original Cloudinary URL approach
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          link.target = '_blank';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`Cloudinary download initiated for: ${fileName}`);
          return {
            success: true,
            materialId: materialId,
            fileName: fileName,
            downloadUrl: downloadUrl,
            method: 'cloudinary_fallback'
          };
        } else {
          throw new Error('Download URL not available');
        }
      }
    } catch (err) {
      console.error('Error with simple download:', err);
      throw err;
    }
  },

  /**
   * Debug function to test endpoints and diagnose issues
   * @param {string} materialId - The ID of the training material to test
   * @returns {Promise<Object>} - Debug information
   */
  debugDownload: async (materialId) => {
    const token = localStorage.getItem('authToken');
    const baseURL = api.defaults.baseURL;
    
    console.log('=== DOWNLOAD DEBUG INFO ===');
    console.log('Material ID:', materialId);
    console.log('Base URL:', baseURL);
    console.log('Token available:', !!token);
    console.log('Token length:', token?.length);
    
    const testResults = {
      materialId,
      baseURL,
      hasToken: !!token,
      endpoints: {}
    };
    
    // Test 1: Check if info endpoint works
    try {
      console.log('Testing info endpoint...');
      const infoUrl = `${baseURL}/assessments/training-materials/download/${materialId}`;
      console.log('Info URL:', infoUrl);
      
      const infoResponse = await fetch(infoUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      testResults.endpoints.info = {
        url: infoUrl,
        status: infoResponse.status,
        ok: infoResponse.ok
      };
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        testResults.endpoints.info.data = infoData;
        console.log('Info endpoint success:', infoData);
      } else {
        const errorText = await infoResponse.text();
        testResults.endpoints.info.error = errorText;
        console.log('Info endpoint failed:', infoResponse.status, errorText);
      }
    } catch (err) {
      console.log('Info endpoint error:', err);
      testResults.endpoints.info = { error: err.message };
    }
    
    // Test 2: Check if file endpoint exists (GET request with range header to minimize data)
    try {
      console.log('Testing file endpoint...');
      const fileUrl = `${baseURL}/assessments/training-materials/file/${materialId}`;
      console.log('File URL:', fileUrl);
      
      const fileResponse = await fetch(fileUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Range': 'bytes=0-0' // Request just the first byte to test availability
        }
      });
      
      testResults.endpoints.file = {
        url: fileUrl,
        status: fileResponse.status,
        ok: fileResponse.ok || fileResponse.status === 206, // 206 Partial Content is also success for range requests
        headers: Object.fromEntries(fileResponse.headers.entries())
      };
      
      console.log('File endpoint HEAD response:', fileResponse.status, fileResponse.ok);
    } catch (err) {
      console.log('File endpoint error:', err);
      testResults.endpoints.file = { error: err.message };
    }
    
    console.log('=== DEBUG RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));
    
    return testResults;
  }
};

export default trainingMaterialsService;