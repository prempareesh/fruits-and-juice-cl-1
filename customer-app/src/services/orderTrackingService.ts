import { supabase } from '../../lib/supabase';
import {
  OrderStatus,
  ORDER_STATUS_FLOW,
  STEP_DELAYS_MS,
  isValidTransition,
  normalizeStatus,
} from '../constants/orderStatus';

export interface TrackingStep {
  status: OrderStatus;
  timestamp: string;
  description: string;
  label: string;
}

export const OrderTrackingService = {
  /**
   * TEST_MODE: auto-progresses the order through each step with realistic delays.
   * Set to false in production — admin drives status updates manually.
   */
  TEST_MODE: false,

  /**
   * Update order status in Supabase with full tracking history.
   * Guards against invalid transitions.
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('status, tracking_steps')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentStatus = normalizeStatus(orderData?.status || 'PENDING');

      // Guard invalid transitions
      if (!isValidTransition(currentStatus, newStatus)) {
        console.warn(`[OrderTracking] Invalid transition: ${currentStatus} → ${newStatus}`);
        return false;
      }

      const existingSteps: TrackingStep[] = orderData?.tracking_steps || [];
      const newStep: TrackingStep = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        description: getStatusDescription(newStatus),
        label: getStatusLabel(newStatus),
      };

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          tracking_steps: [...existingSteps, newStep],
          updated_at: new Date().toISOString(),
          // Mark payment collected on delivery
          ...(newStatus === 'DELIVERED'
            ? { payment_status: 'paid' }
            : {}),
          // Set estimated delivery on confirmation
          ...(newStatus === 'CONFIRMED'
            ? { estimated_delivery: new Date(Date.now() + 45 * 60 * 1000).toISOString() }
            : {}),
        })
        .eq('id', orderId);

      if (error) throw error;

      console.log(`[OrderTracking] ✅ ${orderId} → ${newStatus}`);
      return true;
    } catch (err: any) {
      console.error('[OrderTracking] Update failed:', err.message);
      return false;
    }
  },

  /**
   * Initializes an order with PENDING status and first tracking step.
   */
  async initializeTracking(orderId: string): Promise<boolean> {
    try {
      const initialStep: TrackingStep = {
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        description: 'We\'ve received your order.',
        label: 'Order Placed',
      };

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'PENDING',
          tracking_steps: [initialStep],
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('[OrderTracking] Init failed:', err.message);
      return false;
    }
  },

  /**
   * Auto-progression for TEST_MODE.
   * Progresses through each status step with configurable delays.
   * Returns a cleanup function to cancel pending timers.
   */
  startAutoProgression(
    orderId: string,
    onUpdate: (status: OrderStatus) => void
  ): () => void {
    if (!this.TEST_MODE) return () => {};

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulativeDelay = 0;

    // Skip PENDING (already set), schedule the rest
    const stepsToProgress = ORDER_STATUS_FLOW.slice(1); // CONFIRMED → DELIVERED

    stepsToProgress.forEach((status, i) => {
      const prevStatus = ORDER_STATUS_FLOW[i]; // step before this one
      const delay = STEP_DELAYS_MS[prevStatus] ?? 10000;
      cumulativeDelay += delay;

      const timer = setTimeout(async () => {
        const success = await OrderTrackingService.updateOrderStatus(orderId, status);
        if (success) {
          onUpdate(status);
          console.log(`[AutoProgress] ${status} @ ${cumulativeDelay}ms`);
        }
      }, cumulativeDelay);

      timers.push(timer);
    });

    // Return cleanup
    return () => timers.forEach(clearTimeout);
  },

  /**
   * Fetch the current full tracking state for an order.
   */
  async fetchTrackingState(orderId: string): Promise<{
    status: OrderStatus;
    steps: TrackingStep[];
    estimatedDelivery: string | null;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, tracking_steps, estimated_delivery, delivery_partner:delivery_partner_id(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        status: normalizeStatus(data.status),
        steps: data.tracking_steps || [],
        estimatedDelivery: data.estimated_delivery || null,
        deliveryPartner: data.delivery_partner || null,
      };
    } catch (err) {
      return null;
    }
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusDescription(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING:          'We\'ve received your order.',
    CONFIRMED:        'Your order is confirmed and being queued.',
    PREPARING:        'Our team is freshly preparing your juices.',
    PACKED:           'Your items are safely packed and sealed.',
    OUT_FOR_DELIVERY: 'Your order is on the way.',
    NEARBY:           'Delivery partner is a few minutes away.',
    DELIVERED:        'Order delivered successfully!',
    CANCELLED:        'Your order was cancelled.',
  };
  return map[status];
}

function getStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING:          'Order Placed',
    CONFIRMED:        'Confirmed',
    PREPARING:        'Preparing',
    PACKED:           'Packed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    NEARBY:           'Almost There',
    DELIVERED:        'Delivered',
    CANCELLED:        'Cancelled',
  };
  return map[status];
}
