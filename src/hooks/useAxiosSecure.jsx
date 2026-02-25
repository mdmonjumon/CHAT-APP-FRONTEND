import axios from "axios";
import React from "react";
import useAuth from "./useAuth";
import { useNavigate } from "react-router-dom";

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_API_LINK,
  withCredentials: true,
});

const useAxiosSecure = () => {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();
  axiosSecure.interceptors.request.use(
    async function (config) {
      const token = await user.getIdToken();
      config.headers.authorization = `Bearer ${token}`;
      return config;
    },
    function (error) {
      return Promise.reject(error);
    },
  );

  axiosSecure.interceptors.response.use(
    function (response) {
      return response;
    },
    async function (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        await signOutUser();
        navigate("/login");
      }
      return Promise.reject(error);
    },
  );

  return axiosSecure;
};

export default useAxiosSecure;
