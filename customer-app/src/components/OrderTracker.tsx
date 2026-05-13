import React, { useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
  FadeInRight,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  CheckCircle2,
  Circle,
  Package,
  MapPin,
  Truck,
  Home,
  ClipboardCheck,
  XCircle,
} from 'lucide-react-native';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_DESCRIPTIONS,
  STATUS_COLORS,
  OrderStatus,
  getStepIndex,
} from '../constants/orderStatus';

const { width } = Dimensions.get('window');
const STEP_COUNT = ORDER_STATUS_FLOW.length;

// ─── Step icon mapping ───────────────────────────────────────────────────────
const STEP_ICONS: Record<number, React.ElementType> = {
  0: ClipboardCheck,
  1: CheckCircle2,
  2: Package,
  3: Package,
  4: Truck,
  5: MapPin,
  6: Home,
};

// ─── Individual Step ────────────────────────────────────────────────────────
interface StepProps {
  status: OrderStatus;
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  isLast: boolean;
}

const Step = memo(({ status, index, isCompleted, isActive, isLast }: StepProps) => {
  const color = STATUS_COLORS[status];
  const scale = useSharedValue(isActive ? 1 : 0.85);
  const pulseScale = useSharedValue(1);
  const lineProgress = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isCompleted || isActive ? 1 : 0.85, {
      damping: 15, stiffness: 120,
    });
    lineProgress.value = withTiming(isCompleted ? 1 : 0, { duration: 600 });

    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, isCompleted]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.85, 1], [0.5, 1], Extrapolation.CLAMP),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.18], [0.3, 0], Extrapolation.CLAMP),
  }));

  const lineStyle = useAnimatedStyle(() => ({
    height: `${lineProgress.value * 100}%` as any,
  }));

  const IconComponent = STEP_ICONS[index] || Circle;
  const iconColor = isCompleted || isActive ? '#FFFFFF' : '#94a3b8';
  const bgColor = isCompleted ? '#22C55E' : isActive ? color : '#f1f5f9';

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).springify()}
      style={styles.stepRow}
    >
      {/* Left: icon + connector line */}
      <View style={styles.iconColumn}>
        {/* Pulse ring (active only) */}
        {isActive && (
          <Animated.View style={[styles.pulseRing, { borderColor: color }, pulseStyle]} />
        )}

        {/* Main icon circle */}
        <Animated.View style={[styles.iconCircle, { backgroundColor: bgColor }, circleStyle]}>
          <IconComponent size={18} color={iconColor} />
        </Animated.View>

        {/* Connector line to next step */}
        {!isLast && (
          <View style={styles.lineTrack}>
            <Animated.View style={[styles.lineFill, { backgroundColor: '#22C55E' }, lineStyle]} />
          </View>
        )}
      </View>

      {/* Right: text */}
      <View style={styles.textColumn}>
        <Text
          style={[
            styles.stepLabel,
            (isActive || isCompleted) && styles.activeLabel,
            isCompleted && styles.completedLabel,
          ]}
        >
          {ORDER_STATUS_LABELS[status]}
        </Text>
        {(isActive || isCompleted) && status && (
          <Text style={[styles.stepDesc, isActive && { color: color }]}>
            {ORDER_STATUS_DESCRIPTIONS[status] || ''}
          </Text>
        )}
      </View>

      {/* Right: check badge */}
      {isCompleted && (
        <Animated.View entering={FadeInRight.delay(200)}>
          <CheckCircle2 size={20} color="#22C55E" />
        </Animated.View>
      )}
      {isActive && (
        <View style={[styles.activePill, { backgroundColor: color + '20' }]}>
          <View style={[styles.activeDot, { backgroundColor: color }]} />
          <Text style={[styles.activePillText, { color }]}>Active</Text>
        </View>
      )}
    </Animated.View>
  );
});

// ─── Progress Bar ────────────────────────────────────────────────────────────
const ProgressBar = memo(({ percent }: { percent: number }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent, { duration: 800 });
  }, [percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]} />
      <Text style={styles.progressLabel}>{percent}% Complete</Text>
    </View>
  );
});

// ─── ETA Badge ───────────────────────────────────────────────────────────────
const ETABadge = memo(({ eta }: { eta: string | null }) => {
  if (!eta) return null;
  const etaDate = new Date(eta);
  const now = new Date();
  const diffMs = etaDate.getTime() - now.getTime();
  const diffMins = Math.max(0, Math.round(diffMs / 60000));

  return (
    <View style={styles.etaBadge}>
      <Truck size={14} color="#F97316" />
      <Text style={styles.etaText}>
        {diffMins > 0 ? `Est. arrival in ~${diffMins} min` : 'Arriving now!'}
      </Text>
    </View>
  );
});

// ─── Main OrderTracker ───────────────────────────────────────────────────────
interface OrderTrackerProps {
  currentStepIndex: number;
  progressPercent: number;
  estimatedDelivery?: string | null;
  currentStatus: OrderStatus;
  deliveryPartner?: any;
}

const PartnerCard = memo(({ partner }: { partner: any }) => {
  if (!partner) return null;
  
  return (
    <Animated.View 
      entering={FadeInRight.delay(200).springify()}
      style={styles.partnerCard}
    >
      <View style={styles.partnerHeader}>
        <View style={styles.partnerInfo}>
          <View style={styles.partnerAvatar}>
            <Truck size={24} color="#3A8C3F" />
          </View>
          <View>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerVehicle}>{partner.vehicle_type} • {partner.vehicle_number || 'No Plate'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.callBtn}
          onPress={() => Alert.alert('Calling Partner', `Connecting to ${partner.phone}...`)}
        >
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export function OrderTracker({
  currentStepIndex,
  progressPercent,
  estimatedDelivery,
  currentStatus,
  deliveryPartner,
}: OrderTrackerProps) {
  const isCancelled = currentStatus === 'CANCELLED';
  const isDelivered = currentStatus === 'DELIVERED';

  if (isCancelled) {
    return (
      <View style={[styles.container, styles.cancelledContainer]}>
        <XCircle size={48} color="#EF4444" />
        <Text style={styles.cancelledTitle}>Order Cancelled</Text>
        <Text style={styles.cancelledDesc}>
          {ORDER_STATUS_DESCRIPTIONS.CANCELLED}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isDelivered ? '🎉 Order Delivered!' : '📦 Live Order Tracking'}
        </Text>
        <ETABadge eta={estimatedDelivery ?? null} />
      </View>

      {/* Progress bar */}
      <ProgressBar percent={progressPercent} />

      {/* Delivery Partner Card */}
      {deliveryPartner && <PartnerCard partner={deliveryPartner} />}

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {ORDER_STATUS_FLOW.map((status, index) => (
          <Step
            key={status}
            status={status}
            index={index}
            isCompleted={index < currentStepIndex}
            isActive={index === currentStepIndex}
            isLast={index === ORDER_STATUS_FLOW.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginVertical: 16,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 6,
        }
      : { boxShadow: '0 8px 30px rgba(0,0,0,0.08)' } as any),
  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cancelledTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  cancelledDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
    fontWeight: '600',
  },
  stepsContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    minHeight: 72,
  },
  iconColumn: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    top: -6,
    left: -6,
    zIndex: 1,
  },
  lineTrack: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
    borderRadius: 1,
    minHeight: 32,
  },
  lineFill: {
    width: '100%',
    borderRadius: 1,
  },
  textColumn: {
    flex: 1,
    paddingLeft: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  completedLabel: {
    color: '#22C55E',
  },
  stepDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  partnerCard: {
    backgroundColor: '#F8FAF6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  partnerVehicle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: '#3A8C3F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
