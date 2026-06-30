import React, { useState, useRef } from "react";
import { X, Camera, Users, Award, ShieldAlert } from "lucide-react";
import uploadImage from "../api/utils";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

const GroupSettingsModal = ({ group, onClose, axiosSecure, onGroupUpdated }) => {
  const { user } = useAuth();
  const [chatName, setChatName] = useState(group?.chatName || "");
  const [imgFile, setImgFile] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);

  // Find current user's participant doc to check if they are the admin
  const currentUserDoc = group?.participants?.find((p) => p?.firebaseUid === user?.uid);
  const isCurrentUserAdmin = currentUserDoc && group?.groupAdmin === currentUserDoc?._id;

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

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (isUpdating) return;
    if (!chatName.trim()) return toast.error("Group name cannot be empty");

    setIsUpdating(true);
    const loadingToast = toast.loading("Updating group settings...");

    try {
      let finalImgUrl = group?.groupProfilePic;

      // 1. Upload new group avatar if selected
      if (imgFile) {
        finalImgUrl = await uploadImage(imgFile);
        if (!finalImgUrl) {
          throw new Error("Failed to upload group image to ImgBB");
        }
      }

      // 2. Call backend update endpoint
      const { data } = await axiosSecure.patch(`/message/groups/${group?._id}`, {
        chatName,
        groupProfilePic: finalImgUrl,
      });

      if (data.success) {
        toast.success("Group updated successfully", { id: loadingToast });
        if (onGroupUpdated) {
          onGroupUpdated(data.data);
        }
        onClose();
      } else {
        throw new Error(data.message || "Failed to update group");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update group", { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMakeAdmin = async (newAdminId) => {
    if (isUpdating) return;
    
    const confirmTransfer = window.confirm("Are you sure you want to transfer group admin privileges to this member?");
    if (!confirmTransfer) return;

    setIsUpdating(true);
    const loadingToast = toast.loading("Transferring admin privileges...");

    try {
      const { data } = await axiosSecure.patch(`/message/groups/${group?._id}/make-admin`, {
        newAdminId,
      });

      if (data.success) {
        toast.success("Admin role transferred successfully", { id: loadingToast });
        if (onGroupUpdated) {
          onGroupUpdated(data.data);
        }
      } else {
        throw new Error(data.message || "Failed to transfer admin");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to transfer admin", { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-base-300 flex justify-between items-center bg-primary/5">
          <h3 className="text-xl font-bold">Group Info & Settings</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" disabled={isUpdating}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdateGroup} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Group Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full ring-4 ring-primary ring-offset-2 overflow-hidden bg-base-200 flex items-center justify-center font-bold text-xl">
                {selectedImg ? (
                  <img src={selectedImg} alt="Preview" className="w-full h-full object-cover" />
                ) : group?.groupProfilePic ? (
                  <img src={group.groupProfilePic} alt="Group Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                    {chatName?.substring(0, 2).toUpperCase()}
                  </div>
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
            <span className="text-xs opacity-50">Upload group profile picture</span>
          </div>

          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Group Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40">
                <Users size={18} />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10 focus:outline-primary"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Dream Team"
                required
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Members list */}
          <div className="divider text-xs opacity-40 uppercase tracking-widest">Members ({group?.participants?.length})</div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {group?.participants?.map((member) => (
              <div key={member?._id} className="flex items-center justify-between p-2 rounded-lg bg-base-200/50">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={member?.profilePic} alt={member?.fullName} />
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {member?.fullName} {member?.firebaseUid === user?.uid && " (You)"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {group?.groupAdmin === member?._id ? (
                    <span className="badge badge-primary gap-1 text-[10px] uppercase font-bold py-2">
                      <Award size={10} /> Admin
                    </span>
                  ) : isCurrentUserAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleMakeAdmin(member?._id)}
                      className="btn btn-xs btn-outline btn-primary gap-1 text-[9px] uppercase font-bold"
                      disabled={isUpdating}
                    >
                      Make Admin
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
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

export default GroupSettingsModal;
