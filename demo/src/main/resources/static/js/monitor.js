/**
 * 学祭屋台 呼出しモニター用JavaScript (json-server対応版)
 *
 * 機能:
 * - 定期的にバックエンドAPIを呼び出し、準備完了(READY)のチケット情報を取得する。
 * - 取得したチケット番号を番号の小さい順に画面へ表示する。
 * - 表示する番号がない場合は、待機メッセージを表示する。
 * - API通信に失敗した場合は、エラーメッセージを表示する。
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 設定項目 ---
    // ★ 変更点: json-serverのベースURLを設定
    const API_BASE_URL = 'http://localhost:8080';
    // データ取得のポーリング間隔 (ミリ秒単位。例: 5000 = 5秒)
    const POLLING_INTERVAL = 5000; 
    
    // --- DOM要素の取得 ---
    const boardContainer = document.getElementById('ticket-board-container');
    const statusMessage = document.getElementById('status-message');

    /**
     * チケット番号リストを受け取り、画面に表示する関数
     * @param {Array<Object>} tickets - チケット情報の配列。
     */
    const renderTickets = (tickets) => {
        boardContainer.innerHTML = ''; 
        statusMessage.textContent = '';

        if (!tickets || tickets.length === 0) {
            statusMessage.textContent = 'ただいまお呼び出し中の番号はありません';
            return;
        }
        
        // ★ 変更点: チケット番号が小さい順にソートする
        tickets.sort((a, b) => a.ticket_number - b.ticket_number);

        tickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket-number';
            // ★ 変更点: データ構造に合わせて 'number' から 'ticket_number' に修正
            ticketElement.textContent = ticket.ticket_number; 
            boardContainer.appendChild(ticketElement);
        });
    };

    /**
     * バックエンドAPIから最新のチケット情報を取得し、画面を更新する関数
     */
    const fetchAndUpdateBoard = async () => {
        try {
            // ★ 変更点: 正しいAPIエンドポイントを呼び出す
            const response = await fetch(`${API_BASE_URL}/tickets?status=READY`);

            if (!response.ok) {
                throw new Error(`サーバーからの応答が不正です: ${response.status}`);
            }

            const tickets = await response.json();
            renderTickets(tickets);

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