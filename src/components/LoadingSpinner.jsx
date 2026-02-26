import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
};

export default LoadingSpinner;
