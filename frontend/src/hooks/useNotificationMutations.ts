import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// API functions
const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await axios.get(`${API_URL}/api/notifications`, {
      withCredentials: true,
    });
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await axios.patch(
      `${API_URL}/api/notifications/${id}/read`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },
};

// Hook for fetching notifications
export const useNotifications = () => {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: notificationApi.getAll,
  });
};

// Hook for notification mutations
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),

    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousNotifications =
        queryClient.getQueryData<Notification[]>(["notifications"]) || [];

      // Optimistically mark as read
      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      return { previousNotifications };
    },

    onError: (err, _id, ctx) => {
      // Rollback on error
      if (ctx?.previousNotifications) {
        queryClient.setQueryData(["notifications"], ctx.previousNotifications);
      }
      console.error("❌ Failed to mark notification as read:", err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      console.log("✅ Notification marked as read");
    },
  });

  return {
    markAsRead,
  };
};