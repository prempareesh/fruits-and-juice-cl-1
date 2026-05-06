import axios from 'axios';
import { monitor } from './MonitoringService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/payment', '') || 'https://juice-app-9uzq.onrender.com';

export interface OrderNotificationPayload {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentType: 'cod' | 'online';
  createdAt: string;
}

export const NotificationService = {
  /**
   * Send order notification to admin via Twilio backend
   */
  async sendOrderNotification(payload: OrderNotificationPayload): Promise<boolean> {
    try {
      monitor.log('INFO', 'Notification', 'Sending order notification', { orderId: payload.id });
      
      const response = await axios.post(`${API_BASE_URL}/api/notification/send-order`, {
        orderData: payload
      });

      if (response.data.success) {
        monitor.log('INFO', 'Notification', 'Admin notification sent');
        return true;
      }
      
      throw new Error(response.data.message || 'Notification failed');
    } catch (err: any) {
      monitor.log('ERROR', 'Notification', 'Failed to send admin notification', { 
        error: err.message,
        details: err.response?.data
      });
      return false;
    }
  }
};
