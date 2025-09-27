document.addEventListener('DOMContentLoaded', () => {

  /**
   * 現在json-serverの不具合でitemIdと書くところをidと書いている、-before参照
   */


    // -------------------------------------------------------------
    // ▼▼▼ あなたの環境に合わせてAPIのURLを修正してください ▼▼▼
    // -------------------------------------------------------------
    const baseURL = 'http://localhost:8080'; // 例: Spring Bootのデフォルトポート
    // -------------------------------------------------------------

    const errorMessageElement = document.getElementById('error-message');
    const allToggles = document.querySelectorAll('.availability-toggle');

    /**
     * 現在の商品の提供状況をAPIから取得し、スイッチの状態に反映させる
     */
    const syncInitialState = async () => {
        try {
            const response = await fetch(`${baseURL}/items`);
            if (!response.ok) {
                throw new Error(`APIからのデータ取得に失敗 (HTTP: ${response.status})`);
            }
            const items = await response.json();

            // 取得したデータをもとに、各スイッチのON/OFFを切り替える
            allToggles.forEach(toggle => {
                const id = toggle.dataset.id;
                const targetItem = items.find(item => item.id.toString() === id);
                if (targetItem) {
                    toggle.checked = targetItem.available;
                }
            });

        } catch (error) {
            console.error('初期状態の同期に失敗:', error);
            showError('商品の状態をサーバーから取得できませんでした。');
        }
    };

    /**
     * スイッチが操作されたときに、APIを呼び出して状態を更新する
     * @param {Event} event 
     */
    const handleAvailabilityChange = async (event) => {
        const toggle = event.target;
        const id = toggle.dataset.id;
        const newAvailability = toggle.checked;

        try {
            const response = await fetch(`${baseURL}/items/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ available: newAvailability }),
            });

            if (!response.ok) {
                throw new Error(`APIでの更新に失敗 (HTTP: ${response.status})`);
            }
            
            console.log(`ID:${id} の状態を ${newAvailability} に更新しました。`);
            showError(''); // 成功したらエラーメッセージをクリア

        } catch (error) {
            console.error('更新エラー:', error);
            showError('サーバーとの通信に失敗し、状態を更新できませんでした。');
            // 更新に失敗したので、スイッチの状態を元に戻す
            toggle.checked = !newAvailability;
        }
    };
    
    /**
     * エラーメッセージを表示する
     * @param {string} message 
     */
    const showError = (message) => {
        errorMessageElement.textContent = message;
    };

    // --- メイン処理 ---
    // 1. 最初に全商品の現在の状態をAPIから取得して画面に反映
    syncInitialState();

    // 2. 各スイッチが操作されたらhandleAvailabilityChange関数を呼び出すよう設定
    allToggles.forEach(toggle => {
        toggle.addEventListener('change', handleAvailabilityChange);
    });

    setInterval(syncInitialState, 10000); 
});