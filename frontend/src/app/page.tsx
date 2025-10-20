import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            リサイクルポイントシステム
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            リサイクルでポイントを獲得して、地球環境に貢献しましょう
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">マップ表示</h3>
            <p className="text-gray-600 mb-4">
              最寄りのリサイクルボックスを地図で確認
            </p>
            <Link
              href="/map"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              マップを見る
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">QRスキャン</h3>
            <p className="text-gray-600 mb-4">
              QRコードをスキャンしてポイントを獲得
            </p>
            <button
              disabled
              className="inline-block px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              準備中
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold mb-2">景品交換</h3>
            <p className="text-gray-600 mb-4">
              獲得したポイントで景品と交換
            </p>
            <Link
              href="/rewards"
              className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              景品を選ぶ
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">システムの流れ</h2>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <span className="ml-2">マップで場所選択</span>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2">リサイクル実行</span>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2">QRコード表示</span>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <span className="ml-2">ポイント獲得</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
