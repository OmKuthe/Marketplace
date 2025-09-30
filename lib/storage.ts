// lib/imgbb-storage.ts
const IMGBB_API_KEY = '2e6117c9d92bf16f23690049db98971d'; // Get from https://api.imgbb.com/

export const uploadToImgBB = async (imageUri: string): Promise<string | null> => {
  try {
    console.log('Starting ImgBB upload for:', imageUri);
    
    // Create form data
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData handling
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'product_image.jpg',
    });

    console.log('Sending request to ImgBB...');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('ImgBB response:', data);
    
    if (data.success) {
      console.log('✅ ImgBB upload successful:', data.data.url);
      return data.data.url;
    } else {
      console.error('❌ ImgBB upload failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error uploading to ImgBB:', error);
    return null;
  }
};