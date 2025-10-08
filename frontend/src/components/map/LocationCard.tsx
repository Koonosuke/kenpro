'use client';

import { Location } from '@/types/location';

interface LocationCardProps {
  location: Location;
  isSelected?: boolean;
  onSelect?: (location: Location) => void;
  onRecycle?: (location: Location) => void;
}

export default function LocationCard({
  location,
  isSelected = false,
  onSelect,
  onRecycle,
}: LocationCardProps) {
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

  const isRecycleDisabled = location.status !== 'active';

  return (
    <div
      className={`p-6 border rounded-xl transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{location.name}</h3>
          <p className="text-gray-600 mb-2">{location.address}</p>
          <p className="text-gray-700 mb-3">{location.description}</p>
        </div>
        
        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(location.status)}`}>
          {getStatusText(location.status)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">獲得ポイント</p>
            <p className="text-2xl font-bold text-blue-600">
              {location.points_per_recycle}pt
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">緯度</p>
            <p className="text-sm font-mono">{location.latitude}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">経度</p>
            <p className="text-sm font-mono">{location.longitude}</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        {onSelect && (
          <button
            onClick={() => onSelect(location)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? '選択中' : 'この場所を選択'}
          </button>
        )}
        
        {onRecycle && (
          <button
            onClick={() => onRecycle(location)}
            disabled={isRecycleDisabled}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecycleDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isRecycleDisabled ? '利用不可' : 'リサイクル実行'}
          </button>
        )}
      </div>

      {isSelected && (
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            ✓ この場所が選択されています。リサイクルを実行できます。
          </p>
        </div>
      )}
    </div>
  );
}
