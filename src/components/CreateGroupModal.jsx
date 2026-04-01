import Select, { components } from "react-select";
import { useState } from "react";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { X } from "lucide-react";

const CreateGroupModal = ({ allUsers, onClose }) => {
  const [chatName, setChatName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const axiosSecure = useAxiosSecure();

  // ম্যাপ করে ড্রপডাউনের ফরম্যাটে নেওয়া
  const userOptions = allUsers.map((u) => ({
    value: u._id,
    label: u.fullName,
    profilePic: u.profilePic,
  }));

  const handleCreateGroup = async () => {
    if (!chatName || selectedMembers.length < 2) {
      return alert("Please provide a name and select at least 2 members.");
    }

    const payload = {
      chatName,
      participants: selectedMembers.map((m) => m.value), // শুধুমাত্র আইডিগুলো পাঠানো
      isGroupChat: true,
    };

    try {
      const { data } = await axiosSecure.post("/message/create-group", payload);
      console.log("Group Created:", data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // কাস্টম অপশন কম্পোনেন্ট
  const CustomOption = (props) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="avatar">
            <div className="w-8 h-8 rounded-full">
              <img src={props.data.profilePic} alt={props.data.label} />
            </div>
          </div>
          <span className="font-medium text-sm text-gray-700">
            {props.data.label}
          </span>
        </div>
      </components.Option>
    );
  };

  // সিলেক্ট করা হওয়ার পর বক্সের ভেতরে যা দেখাবে (Multi-value tag)
  const CustomMultiValue = (props) => {
    return (
      <components.MultiValue {...props}>
        <div className="flex items-center gap-1 pr-1">
          <img
            src={props.data.profilePic}
            className="w-4 h-4 rounded-full"
            alt=""
          />
          <span>{props.data.label}</span>
        </div>
      </components.MultiValue>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-base-300 flex justify-between items-center bg-primary/5">
          <h3 className="text-xl font-bold">New Group Chat</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Group Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered focus:outline-primary"
              placeholder="e.g. Dream Team"
              onChange={(e) => setChatName(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Select Members</span>
            </label>
            <Select
              isMulti
              options={userOptions}
              components={{
                Option: CustomOption,
                MultiValue: CustomMultiValue,
              }}
              placeholder="Search and select members..."
              className="text-base-content"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "2px",
                  borderColor: "#e5e7eb", // border-base-300
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#f3f4f6" : "white", // hover effect
                  color: "inherit",
                }),
              }}
              onChange={(selected) => setSelectedMembers(selected)}
            />
          </div>
        </div>

        <div className="p-4 bg-base-200 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary px-8"
            disabled={!chatName || selectedMembers.length < 2}
            onClick={handleCreateGroup}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
