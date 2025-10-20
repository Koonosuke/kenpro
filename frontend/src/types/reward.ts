export interface Reward {
  reward_id: string;
  name: string;
  description: string;
  points_cost: number;
  stock_count: number;
  is_active: boolean;
  category?: string;
  image_url?: string;
  redeemable_from?: string | null;
  redeemable_until?: string | null;
  redemption_limit_per_user?: number | null;
  redemption_limit_per_day?: number | null;
  total_redeemed?: number;
  terms_and_conditions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RewardListResponse {
  rewards: Reward[];
  total_count: number;
  next_token?: string | null;
}

export interface ExchangeResponse {
  success: boolean;
  reward_id: string;
  reward_name: string;
  points_used: number;
  new_balance: number;
  exchange_id: string;
  exchanged_at: string;
  status?: string;
  voucher_code?: string | null;
}
