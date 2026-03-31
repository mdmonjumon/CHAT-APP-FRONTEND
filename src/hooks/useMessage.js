import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "./useAxiosSecure";

const useMessages = (conversationId) => {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const response = await axiosSecure.get(`/message/${conversationId}`);
      return response.data.data;
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5,
  });
};

export default useMessages;
