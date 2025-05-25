// Helper function to convert file to base64 with compression
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    // For image files, compress before converting to base64
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions - maintain aspect ratio but limit max dimensions
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as base64 string (0.7 quality - better compression)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          console.log(`Image compressed: ${Math.round((compressedBase64.length * 0.75) / 1024)}KB`);
          resolve(compressedBase64);
        };
      };
      reader.onerror = error => reject(error);
    } else {
      // For non-image files, proceed without compression
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, part
      reader.onerror = error => reject(error);
    }
  });
};

export default convertFileToBase64;
