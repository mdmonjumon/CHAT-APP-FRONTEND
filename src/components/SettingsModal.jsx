import React, { useState, useRef } from "react";
import { X, Camera, Lock, User, KeyRound } from "lucide-react";
import useAuth from "../hooks/useAuth";
import uploadImage from "../api/utils";
import toast from "react-hot-toast";
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase/firebase.init";

const SettingsModal = ({ onClose, axiosSecure }) => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (isUpdating) return;

    if (!currentPassword) {
      return toast.error("Current password is required to verify identity");
    }

    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password && password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsUpdating(true);
    const loadingToast = toast.loading("Verifying password and updating profile...");

    try {
      // 1. Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      let finalImgUrl = user?.photoURL;

      // 2. Upload image if selected
      if (imgFile) {
        finalImgUrl = await uploadImage(imgFile);
        if (!finalImgUrl) {
          throw new Error("Failed to upload image to ImgBB");
        }
      }

      // 3. Update Firebase user profile (name & image)
      await updateProfile(auth.currentUser, {
        displayName: fullName,
        photoURL: finalImgUrl,
      });

      // 4. Update MongoDB user record
      await axiosSecure.patch("/allUsers/update-profile", {
        fullName,
        profilePic: finalImgUrl,
      });

      // 5. Update password if provided
      if (password) {
        await updatePassword(auth.currentUser, password);
        toast.success("Password updated successfully");
      }

      // 6. Reload Firebase user & update context state
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });

      toast.success("Profile updated successfully", { id: loadingToast });
      onClose();
    } catch (err) {
      console.error(err);
      let errMsg = err.message || "Failed to update profile";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errMsg = "Incorrect current password. Verification failed.";
      }
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-base-300 flex justify-between items-center bg-primary/5">
          <h3 className="text-xl font-bold">Account Settings</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" disabled={isUpdating}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full ring-4 ring-base-300 overflow-hidden bg-base-200 flex items-center justify-center">
                {selectedImg ? (
                  <img src={selectedImg} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-base-content/20" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-primary-content p-1.5 rounded-full shadow-md hover:scale-105 transition-transform"
                disabled={isUpdating}
              >
                <Camera size={14} />
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <span className="text-xs opacity-50">Upload new profile picture</span>
          </div>

          {/* Full Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Full Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                <User size={18} />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10 focus:outline-primary"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="divider text-xs opacity-40 uppercase tracking-widest">Verification</div>

          {/* Current Password Verification */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-error">Current Password *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                <KeyRound size={18} />
              </div>
              <input
                type="password"
                className="input input-bordered w-full pl-10 border-error/50 focus:outline-error"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to verify"
                required
                disabled={isUpdating}
              />
            </div>
            <label className="label">
              <span className="label-text-alt opacity-60">Required to authorize any profile update.</span>
            </label>
          </div>

          <div className="divider text-xs opacity-40 uppercase tracking-widest">Change Password</div>

          {/* New Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">New Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="input input-bordered w-full pl-10 focus:outline-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep same"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Confirm Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="input input-bordered w-full pl-10 focus:outline-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="p-4 bg-base-200/50 rounded-xl flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isUpdating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
