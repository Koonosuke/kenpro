'use client';

import { useEffect, useMemo, useState } from 'react';
import RewardCard from '@/components/rewards/RewardCard';
import { ExchangeResponse, Reward } from '@/types/reward';

const MOCK_BALANCE = 250;

const mockRewards: Reward[] = [
  {
    reward_id: 'reward_001',
    name: 'エコバッグ',
    description: '再生コットンを使用したオリジナルエコバッグ。',
    points_cost: 120,
    stock_count: 25,
    is_active: true,
    category: '生活雑貨',
    image_url: '',
    redeemable_from: '2024-01-01T00:00:00Z',
    redeemable_until: null,
    redemption_limit_per_user: 3,
    redemption_limit_per_day: 1,
    total_redeemed: 145,
    terms_and_conditions: 'お一人様1日1点まで。店舗での引き換え時にアプリ画面を提示してください。',
  },
  {
    reward_id: 'reward_002',
    name: 'コーヒーチケット',
    description: '提携カフェで利用できるドリンク引換券。',
    points_cost: 80,
    stock_count: 0,
    is_active: true,
    category: '飲食',
    redeemable_from: '2024-02-01T00:00:00Z',
    redeemable_until: '2024-12-31T23:59:59Z',
    redemption_limit_per_user: 5,
    total_redeemed: 320,
    terms_and_conditions: '一部店舗ではご利用いただけません。詳細は店舗一覧をご確認ください。',
  },
  {
    reward_id: 'reward_003',
    name: 'オリジナルステッカーセット',
    description: '限定デザインのステッカー3枚セット。',
    points_cost: 30,
    stock_count: 120,
    is_active: true,
    category: 'ノベルティ',
    redemption_limit_per_user: 10,
    total_redeemed: 980,
  },
];

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState<number>(MOCK_BALANCE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [lastExchange, setLastExchange] = useState<ExchangeResponse | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);

        if (!apiBaseUrl) {
          // Mock モード
          await new Promise((resolve) => setTimeout(resolve, 600));
          setRewards(mockRewards);
          setError(null);
          return;
        }

        const response = await fetch(`${apiBaseUrl}/rewards?is_active=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch rewards: ${response.status}`);
        }

        const data = await response.json();
        setRewards(data.rewards ?? []);
        setError(null);
      } catch (err) {
        console.error('Failed to load rewards', err);
        setError('景品情報の取得に失敗しました。時間を置いて再度お試しください。');
        setRewards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [apiBaseUrl]);

  const handleRedeem = async (reward: Reward) => {
    setRedeemingId(reward.reward_id);
    setLastExchange(null);
    try {
      if (!apiBaseUrl) {
        // Mock 処理
        if (balance < reward.points_cost) {
          setError('ポイント残高が不足しています。');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        const newBalance = balance - reward.points_cost;
        setBalance(newBalance);
        setRewards((prev) =>
          prev.map((item) =>
            item.reward_id === reward.reward_id
              ? { ...item, stock_count: Math.max((item.stock_count ?? 1) - 1, 0) }
              : item,
          ),
        );
        setError(null);
        setLastExchange({
          success: true,
          reward_id: reward.reward_id,
          reward_name: reward.name,
          points_used: reward.points_cost,
          new_balance: newBalance,
          exchange_id: `mock-${reward.reward_id}-${Date.now()}`,
          exchanged_at: new Date().toISOString(),
          status: 'completed',
        });
        return;
      }

      const response = await fetch(`${apiBaseUrl}/rewards/${reward.reward_id}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to exchange reward');
      }

      const result: ExchangeResponse = await response.json();
      setLastExchange(result);
      setBalance(result.new_balance);
      setRewards((prev) =>
        prev.map((item) =>
          item.reward_id === reward.reward_id
            ? { ...item, stock_count: Math.max((item.stock_count ?? 1) - 1, 0) }
            : item,
        ),
      );
      setError(null);
    } catch (err) {
      console.error('Failed to exchange reward', err);
      setError(
        err instanceof Error ? err.message : '景品交換に失敗しました。時間を置いて再度お試しください。',
      );
    } finally {
      setRedeemingId(null);
    }
  };

  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => a.points_cost - b.points_cost);
  }, [rewards]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">景品一覧を読み込み中...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">景品交換センター</h1>
            <p className="text-gray-600 mt-2">
              獲得したポイントで好きな景品と交換しましょう。残高と交換履歴を確認しながら、環境への貢献を楽しんでください。
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-right">
            <span className="block text-sm text-emerald-700">現在のポイント残高</span>
            <span className="text-3xl font-bold text-emerald-600">{balance} pt</span>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {lastExchange && (
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg text-emerald-700 flex items-center justify-between">
            <div>
              <p className="font-semibold">{lastExchange.reward_name} を交換しました！</p>
              <p className="text-sm mt-1">
                交換 ID: {lastExchange.exchange_id} / 残り {lastExchange.new_balance} pt
              </p>
            </div>
            <span className="text-sm">{new Date(lastExchange.exchanged_at).toLocaleString('ja-JP')}</span>
          </div>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">交換可能な景品</h2>
          {sortedRewards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-600">
              現在交換可能な景品はありません。後ほど再度ご確認ください。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedRewards.map((reward) => (
                <RewardCard
                  key={reward.reward_id}
                  reward={reward}
                  onRedeem={handleRedeem}
                  busy={redeemingId === reward.reward_id}
                  disabled={balance < reward.points_cost}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
