'use client';

import { Location } from '@/types/location';

interface LocationListProps {
  locations: Location[];
  selectedLocation?: Location | null;
  onLocationSelect?: (location: Location) => void;
  filter?: 'active' | 'maintenance' | 'offline' | 'all';
  onFilterChange?: (filter: 'active' | 'maintenance' | 'offline' | 'all') => void;
}

export default function LocationList({
  locations,
  selectedLocation,
  onLocationSelect,
  filter = 'all',
  onFilterChange,
}: LocationListProps) {
  const getStatusColor = (status: Location['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Location['status']) => {
    switch (status) {
      case 'active':
        return '利用可能';
      case 'maintenance':
        return 'メンテナンス中';
      case 'offline':
        return '利用停止';
      default:
        return '不明';
    }
  };

  const filteredLocations = locations.filter((location) => {
    if (filter === 'all') return true;
    return location.status === filter;
  });

  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-3">リサイクルボックス一覧</h2>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'active', label: '利用可能' },
            { key: 'maintenance', label: 'メンテナンス' },
            { key: 'offline', label: '利用停止' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onFilterChange?.(key as any)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>該当するリサイクルボックスが見つかりません</p>
          </div>
        ) : (
          filteredLocations.map((location) => (
            <div
              key={location.location_id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedLocation?.location_id === location.location_id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onLocationSelect?.(location)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{location.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(location.status)}`}>
                  {getStatusText(location.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{location.address}</p>
              <p className="text-sm text-gray-700 mb-3">{location.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {location.points_per_recycle}ポイント
                </span>
                {selectedLocation?.location_id === location.location_id && (
                  <span className="text-sm font-medium text-blue-600">
                    選択中
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
