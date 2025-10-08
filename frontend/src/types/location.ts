export interface Location {
  location_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'maintenance' | 'offline';
  points_per_recycle: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LocationListResponse {
  locations: Location[];
  total_count: number;
}

export interface LocationResponse {
  location: Location;
}

export interface LocationFilter {
  status?: 'active' | 'maintenance' | 'offline';
}
