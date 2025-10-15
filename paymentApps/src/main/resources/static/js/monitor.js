/**
 * 学祭屋台 呼出しモニター用JavaScript
 *
 * 機能:
 * - 定期的にバックエンドAPIを呼び出し、準備完了(servingStatus=1)の注文情報を取得する。
 * - 取得した注文番号を番号の小さい順に画面へ表示する。
 * - 表示する番号がない場合は、待機メッセージを表示する。
 * - API通信に失敗した場合は、エラーメッセージを表示する。
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 設定項目 ---
    const API_BASE_URL = "https://dev-cdmts-pay.codemates.net/api";
    const POLLING_INTERVAL = 5000; // データ取得の間隔 (5秒)
    
    // --- DOM要素の取得 ---
    const boardContainer = document.getElementById('ticket-board-container');
    const statusMessage = document.getElementById('status-message');

    /**
     * 注文番号リストを受け取り、画面に表示する関数
     * @param {Array<Object>} orders - 注文情報の配列。
     */
    const renderOrders = (orders) => {
        boardContainer.innerHTML = ''; 
        statusMessage.textContent = '';

        if (!orders || orders.length === 0) {
            statusMessage.textContent = 'ただいまお呼び出し中の番号はありません';
            return;
        }
        
        // ★ 変更点: 注文番号(orderId)が小さい順にソートする
        orders.sort((a, b) => a.orderId - b.orderId);

        orders.forEach(order => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket-number';
            // ★ 変更点: データ構造に合わせて 'ticket_number' から 'orderId' に修正
            ticketElement.textContent = order.orderId; 
            boardContainer.appendChild(ticketElement);

            // チケット数に応じてクラスを追加する
            boardContainer.classList.remove('many-tickets', 'very-many-tickets');
            const ticketCount = orders.length; // 描画したチケットの数を取得
            if (ticketCount >= 15) {
              boardContainer.classList.add('very-many-tickets');
            } else if (ticketCount >= 10) {
              boardContainer.classList.add('many-tickets');
          }
        });
    };

    /**
     * バックエンドAPIから最新の注文情報を取得し、画面を更新する関数
     */
    const fetchAndUpdateBoard = async () => {
        try {
            // ★ 変更点: servingStatus=1の注文を取得するようにAPIエンドポイントを変更
            const response = await fetch(`${API_BASE_URL}/OrderTable?servingStatus=1`); //多分 (BaseURL)/

            if (!response.ok) {
                throw new Error(`サーバーからの応答が不正です: ${response.status}`);
            }

            const orders = await response.json();
            renderOrders(orders);

        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            boardContainer.innerHTML = '';
            statusMessage.textContent = '更新エラーが発生しました。接続を確認してください。';
        }
    };

    // --- 実行処理 ---
    fetchAndUpdateBoard(); 
    setInterval(fetchAndUpdateBoard, POLLING_INTERVAL);
});