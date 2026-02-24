import axios from "axios";

const uploadImage = async (imageData) => {
  try {
    const imageFormData = new FormData();
    imageFormData.append("image", imageData);

    const { data } = await axios.post(
      `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMAGEBB_API_KEY}`,
      imageFormData,
    );
    return data?.data?.url;
  } catch (error) {
    console.error("ImgBB Upload Error:", error);
    return null;
  }
};

export default uploadImage;
