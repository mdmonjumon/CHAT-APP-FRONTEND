import { useInfiniteQuery } from "@tanstack/react-query";
import useAxiosSecure from "./useAxiosSecure";

const useMessages = (conversationId) => {
  const axiosSecure = useAxiosSecure();

  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam = null }) => {
      const response = await axiosSecure.get(`/message/${conversationId}`, {
        params: {
          limit: 30,
          before: pageParam,
        },
      });
      return response.data.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.length >= 30) {
        // returning the oldest message's timestamp on this page
        return lastPage[0].createdAt;
      }
      return undefined;
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5,
  });
};

export default useMessages;
