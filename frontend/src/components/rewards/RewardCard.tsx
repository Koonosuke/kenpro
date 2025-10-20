'use client';

import { useMemo } from 'react';
import { Reward } from '@/types/reward';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
  disabled?: boolean;
  busy?: boolean;
}

export default function RewardCard({
  reward,
  onRedeem,
  disabled = false,
  busy = false,
}: RewardCardProps) {
  const {
    isOutOfStock,
    isExpired,
    isNotStarted,
    statusLabel,
  } = useMemo(() => evaluateStatus(reward), [reward]);

  const buttonDisabled = disabled || busy || isOutOfStock || isExpired || isNotStarted || !reward.is_active;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      {reward.image_url ? (
        <img
          src={reward.image_url}
          alt={reward.name}
          className="w-full h-40 object-cover rounded-t-xl"
        />
      ) : (
        <div className="w-full h-40 rounded-t-xl bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center text-4xl">
          🎁
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{reward.name}</h3>
          <span className="text-lg font-bold text-emerald-600">{reward.points_cost}pt</span>
        </div>

        <p className="text-gray-600 text-sm mt-3 flex-1">{reward.description}</p>

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          {reward.category && (
            <div>
              <span className="font-medium text-gray-600">カテゴリ:</span> {reward.category}
            </div>
          )}
          <div>
            <span className="font-medium text-gray-600">在庫:</span>{' '}
            {typeof reward.stock_count === 'number' ? `${reward.stock_count} 個` : '要確認'}
          </div>
          {reward.redemption_limit_per_user && (
            <div>
              <span className="font-medium text-gray-600">お一人様上限:</span>{' '}
              {reward.redemption_limit_per_user} 回
            </div>
          )}
          {reward.redemption_limit_per_day && (
            <div>
              <span className="font-medium text-gray-600">日次上限:</span>{' '}
              {reward.redemption_limit_per_day} 回
            </div>
          )}
          {(reward.redeemable_from || reward.redeemable_until) && (
            <div>
              <span className="font-medium text-gray-600">交換期間:</span>{' '}
              {formatDateRange(reward.redeemable_from, reward.redeemable_until)}
            </div>
          )}
          {reward.total_redeemed !== undefined && (
            <div>
              <span className="font-medium text-gray-600">累計交換数:</span>{' '}
              {reward.total_redeemed} 回
            </div>
          )}
        </div>

        {reward.terms_and_conditions && (
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
            {reward.terms_and_conditions}
          </p>
        )}

        <div className="mt-6">
          <button
            onClick={() => onRedeem(reward)}
            disabled={buttonDisabled}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              buttonDisabled
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {busy ? '交換処理中...' : statusLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function evaluateStatus(reward: Reward) {
  const now = new Date();
  const notStarted =
    reward.redeemable_from !== undefined &&
    reward.redeemable_from !== null &&
    new Date(reward.redeemable_from) > now;

  const expired =
    reward.redeemable_until !== undefined &&
    reward.redeemable_until !== null &&
    new Date(reward.redeemable_until) < now;

  const outOfStock = typeof reward.stock_count === 'number' && reward.stock_count <= 0;

  let statusLabel = '交換する';

  if (!reward.is_active) {
    statusLabel = '受付停止中';
  } else if (notStarted) {
    statusLabel = '受付前';
  } else if (expired) {
    statusLabel = '受付終了';
  } else if (outOfStock) {
    statusLabel = '在庫なし';
  }

  return {
    isNotStarted: notStarted,
    isExpired: expired,
    isOutOfStock: outOfStock,
    statusLabel,
  };
}

function formatDateRange(from?: string | null, until?: string | null) {
  const format = (value: string) =>
    new Date(value).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (from && until) {
    return `${format(from)} 〜 ${format(until)}`;
  }
  if (from) {
    return `${format(from)} 以降`;
  }
  if (until) {
    return `${format(until)} まで`;
  }
  return '常時交換可能';
}
