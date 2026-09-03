export type UserRole = 'ELDERLY' | 'FAMILY';

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ElderlyProfile {
  id: string;
  name: string;
  healthConditions: string[];
  bloodType?: string;
  weight?: number;
  height?: number;
  allergies: string[];
  notes?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
  nextDoseTime?: string;
  scheduleTimes: string[];
  daysOfWeek: number[];
  taken: boolean;
}

export interface MedicationLogEntry {
  id: string;
  medicationId: string;
  status: 'TAKEN' | 'MISSED';
  takenAt: string;
}

export interface HealthMetric {
  id: string;
  type: string;
  value: string;
  valueSecondary?: string;
  unit?: string;
  recordedAt: string;
}

export interface ElderlySummary {
  elderlyId: string;
  elderlyName: string;
  phone?: string;
  healthConditions: string[];
}

export interface AppointmentItem {
  id: string;
  doctor: string;
  specialty: string;
  location?: string;
  appointmentDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  createdAt?: string;
}

export interface EmergencyEvent {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  escalationLevel?: number;
  emergencyCallLoggedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  messageId: number;
  role: 'USER' | 'AI';
  content: string;
  intent?: string;
  sessionId?: string;
  createdAt: string;
}

export interface CameraStatusResponse {
  hasCamera: boolean;
  cameraCount?: number;
  allOnline?: boolean;
  indicatorColor?: string;
  statusText?: string;
  message?: string;
}

export interface GoogleFitStatusResponse {
  connected: boolean;
  configured: boolean;
}

export interface PaymentInitResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
  planType: string;
  provider: 'VNPAY' | 'MOMO';
}
