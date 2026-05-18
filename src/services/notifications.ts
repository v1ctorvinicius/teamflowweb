// src/services/notifications.ts
import { api } from "./api";

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "new_product" | "admin_message" | "order";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
  pagination: {
    limit: number;
    total: number;
  };
}

export const notificationsService = {
  async getNotifications(): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>("/me/notifications");
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ unreadCount: number }>(
      "/me/notifications/unread-count",
    );
    return data.unreadCount;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/me/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/me/notifications/read-all");
  },
};
