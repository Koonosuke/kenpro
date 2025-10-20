'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MapView from '@/components/map/MapView';
import LocationList from '@/components/map/LocationList';
import LocationCard from '@/components/map/LocationCard';
import { Location } from '@/types/location';

// Dynamically import MapView to avoid SSR issues with Leaflet
const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">マップを読み込み中...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filter, setFilter] = useState<'active' | 'maintenance' | 'offline' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        if (!apiBaseUrl) {
          throw new Error('API ベース URL が設定されていません。');
        }

        const response = await fetch(`${apiBaseUrl}/locations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`位置情報の取得に失敗しました (status: ${response.status})`);
        }

        const data = await response.json();
        const fetchedLocations: Location[] = Array.isArray(data?.locations)
          ? data.locations
          : [];

        setLocations(fetchedLocations);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '位置情報の取得に失敗しました',
        );
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [apiBaseUrl]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleRecycle = (location: Location) => {
    if (location.status !== 'active') {
      alert('このリサイクルボックスは現在利用できません');
      return;
    }
    
    // TODO: Implement recycle functionality
    alert(`${location.name}でリサイクルを開始します`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">位置情報を読み込み中...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">リサイクルボックスマップ</h1>
          <p className="text-gray-600">
            最寄りのリサイクルボックスを選択して、リサイクルを開始しましょう
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">マップ</h2>
              <div className="relative z-0">
                <DynamicMapView
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
          </div>

          {/* Location List Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <LocationList
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                filter={filter}
                onFilterChange={setFilter}
              />
            </div>
          </div>
        </div>

        {/* Selected Location Card */}
        {selectedLocation && (
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">選択中のリサイクルボックス</h2>
              <LocationCard
                location={selectedLocation}
                isSelected={true}
                onRecycle={handleRecycle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
