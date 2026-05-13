import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { OrderStatus, ORDER_STATUS_FLOW, getStepIndex, normalizeStatus } from '../constants/orderStatus';
import { OrderTrackingService, TrackingStep } from '../services/orderTrackingService';

export interface OrderTrackingState {
  currentStatus: OrderStatus;
  trackingSteps: TrackingStep[];
  estimatedDelivery: string | null;
  loading: boolean;
  currentStepIndex: number;
  progressPercent: number;
  isDelivered: boolean;
  isCancelled: boolean;
  isActive: boolean;
}

/**
 * useOrderTracking — manages full order lifecycle state.
 *
 * Features:
 * - Initial data fetch
 * - Supabase realtime subscription (instant UI updates)
 * - TEST_MODE auto-progression (starts immediately when hook mounts)
 * - Stable cleanup on unmount
 */
export function useOrderTracking(orderId: string): OrderTrackingState {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('PENDING');
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<any | null>(null);

  const applyStatus = useCallback((rawStatus: string, steps: TrackingStep[], eta: string | null, partner?: any) => {
    const normalized = normalizeStatus(rawStatus);
    setCurrentStatus(normalized);
    setTrackingSteps(steps || []);
    setEstimatedDelivery(eta);
    if (partner) setDeliveryPartner(partner);
  }, []);

  // ── Initial fetch ────────────────────────────────────────────────────────
  const fetchInitial = useCallback(async () => {
    if (!orderId) return;
    try {
      const state = await OrderTrackingService.fetchTrackingState(orderId);
      if (state) {
        applyStatus(state.status, state.steps, state.estimatedDelivery, state.deliveryPartner);
      }
    } catch (err) {
      console.error('[useOrderTracking] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, applyStatus]);

  useEffect(() => {
    if (!orderId) return;

    fetchInitial();

    // ── Realtime subscription ───────────────────────────────────────────
    const channel = supabase
      .channel(`order_track_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const { status, tracking_steps, estimated_delivery } = payload.new;
          applyStatus(status, tracking_steps || [], estimated_delivery || null);
        }
      )
      .subscribe();

    // ── Auto-progression (TEST_MODE) ────────────────────────────────────
    if (OrderTrackingService.TEST_MODE) {
      cleanupAutoProgressRef.current = OrderTrackingService.startAutoProgression(
        orderId,
        (newStatus) => setCurrentStatus(newStatus)
      );
    }

    return () => {
      channel.unsubscribe();
      cleanupAutoProgressRef.current?.();
    };
  }, [orderId, fetchInitial, applyStatus]);

  const currentStepIndex = getStepIndex(currentStatus);
  const totalSteps = ORDER_STATUS_FLOW.length - 1; // 0-indexed max
  const progressPercent = Math.round((currentStepIndex / totalSteps) * 100);

  return {
    currentStatus,
    trackingSteps,
    estimatedDelivery,
    loading,
    currentStepIndex,
    progressPercent,
    isDelivered: currentStatus === 'DELIVERED',
    isCancelled: currentStatus === 'CANCELLED',
    isActive: currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED',
    deliveryPartner,
  };
}
