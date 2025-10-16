document.addEventListener('DOMContentLoaded', () => {
    /**
     * sample.jsonのデータ形式に合わせて修正済み
     * APIエンドポイント: /ItemTable
     * 商品ID: itemId
     */

    // -------------------------------------------------------------
    // ▼▼▼ あなたの環境に合わせてAPIのURLを修正してください ▼▼▼
    // -------------------------------------------------------------
    const baseURL = "https://dev-cdmts-pay.codemates.net:8080/api";
    // -------------------------------------------------------------

    const errorMessageElement = document.getElementById('error-message');
    const allToggles = document.querySelectorAll('.availability-toggle');

    /**
     * 現在の商品の提供状況をAPIから取得し、スイッチの状態に反映させる
     */
    const syncInitialState = async () => {
        try {
            // ★ 変更点: APIエンドポイントを /items から /ItemTable に変更
            const response = await fetch(`${baseURL}/item/get/allItems`);
            if (!response.ok) {
                throw new Error(`APIからのデータ取得に失敗 (HTTP: ${response.status})`);
            }
            const items = await response.json();

            // 取得したデータをもとに、各スイッチのON/OFFを切り替える
            allToggles.forEach(toggle => {
                // HTML側の data-id 属性からIDを取得
                const itemIdFromDOM = toggle.dataset.id;
                // ★ 変更点: item.id を item.itemId に変更して商品を検索
                const targetItem = items.find(item => item.itemId.toString() === itemIdFromDOM);
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
//    const handleAvailabilityChange = async (event) => {
//        const toggle = event.target;
//        // ★ 変更点: 変数名を id から itemId に変更（可読性のため）
//        const itemId = toggle.dataset.id;
//        const newAvailability = toggle.checked;
//
//        try {
//            // ★ 変更点: APIエンドポイントを /items/{id} から /ItemTable/{itemId} に変更
//            const response = await fetch(`${baseURL}/ItemTable/${itemId}`, {
//                method: 'PATCH',
//                headers: {
//                    'Content-Type': 'application/json',
//                },
//                // 'available' というキー名は sample.json と同じなので変更なし
//                body: JSON.stringify({ available: newAvailability }),
//            });
//
//            if (!response.ok) {
//                throw new Error(`APIでの更新に失敗 (HTTP: ${response.status})`);
//            }
//            
//            // ★ 変更点: ログメッセージを itemId に合わせて修正 ログメッセージ消した
//            showError(''); // 成功したらエラーメッセージをクリア
//
//        } catch (error) {
//            console.error('更新エラー:', error);
//            showError('サーバーとの通信に失敗し、状態を更新できませんでした。');
//            // 更新に失敗したので、スイッチの状態を元に戻す
//            toggle.checked = !newAvailability;
//        }
//    };
	
	const handleAvailabilityChange = async (event) => {
	    const toggle = event.target;
	    const itemId = toggle.dataset.id;
	    const newAvailability = toggle.checked;

	    try {
	        const response = await fetch(`${baseURL}/items/set/available/${itemId}/${newAvailability}`, {
	            method: 'POST',
	        });

	        if (!response.ok) {
	            throw new Error(`APIでの更新に失敗 (HTTP: ${response.status})`);
	        }

	        showError(''); // 成功したらエラーメッセージをクリア

	    } catch (error) {
	        console.error('更新エラー:', error);
	        showError('サーバーとの通信に失敗し、状態を更新できませんでした。');
	        toggle.checked = !newAvailability; // 失敗時に元に戻す
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

    // 10秒ごとに在庫状況をサーバーと同期する
    setInterval(syncInitialState, 10000); 
});