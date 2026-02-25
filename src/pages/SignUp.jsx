import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  MessageSquare,
  Camera,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import uploadImage from "../api/utils";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import axios from "axios";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);
  const { createUser, signOutUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);

    // Basic validation to ensure it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImg(reader.result); // Set preview URL
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data) => {
    try {
      if (!imgFile) {
        return toast.error("Please select an image");
      }
      const imgUrl = await uploadImage(imgFile);
      const userCredential = await createUser(data?.email, data?.password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      const userInfo = {
        fullName: data?.fullName,
        profilePic: imgUrl,
      };
      await axios.post(
        `${import.meta.env.VITE_API_LINK}/auth/signup`,
        userInfo,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <MessageSquare size={32} />
            </div>
            <h2 className="card-title text-2xl font-bold">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* --- AVATAR UPLOAD SECTION --- */}
            <div className="flex flex-col items-center gap-4 mb-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full ring-4 ring-base-300 overflow-hidden bg-base-200 flex items-center justify-center">
                  {selectedImg ? (
                    <img
                      src={selectedImg}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-base-content/20" />
                  )}
                </div>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    absolute bottom-0 right-0 bg-primary p-2 rounded-full text-primary-content 
                    hover:scale-110 transition-all shadow-lg
                  `}
                >
                  <Camera size={18} />
                </button>

                {/* Remove Image Button */}
                {selectedImg && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 bg-error text-error-content rounded-full p-1 shadow-sm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <p className="text-xs text-base-content/60">
                {selectedImg ? "Looks great!" : "Upload a profile picture"}
              </p>
            </div>

            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                  <User size={18} />
                </div>
                <input
                  {...register("fullName", { required: "Name is required" })}
                  type="text"
                  placeholder="John Doe"
                  className={`input outline-0 input-bordered w-full pl-10 ${errors.fullName ? "input-error" : ""}`}
                />
              </div>
              {errors.fullName && (
                <span className="text-error text-xs mt-1">
                  {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                  <Mail size={18} />
                </div>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className={`input outline-0 input-bordered w-full pl-10 ${errors.email ? "input-error" : ""}`}
                />
              </div>
              {errors.email && (
                <span className="text-error text-xs mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                  <Lock size={18} />
                </div>
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input outline-0 input-bordered w-full pl-10 ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-xs mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4">
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
