export interface User {
  id: number;
  user_name: string;
  user_phone: string;
  user_email: string;
  user_address: string;
  user_type: string;
  user_flatno: string;
  user_dropcode: string;
  user_pickupcode: string;
  user_credit_limit: string;
  user_credit_used: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface Reservation {
  id: string;
  type: 'drop' | 'pickup';
  status: 'pending' | 'completed' | 'cancelled';
  podName: string;
  timestamp: string;
  description: string;
}

export interface Pod {
  id: string;
  name: string;
  location_id: string;
  status: 'available' | 'occupied' | 'maintenance';
}