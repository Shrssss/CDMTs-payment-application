document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = "/api";
    const POLLING_INTERVAL = 5000;

    const boardContainer = document.getElementById('ticket-board-container');
    const statusMessage = document.getElementById('status-message');

    const renderOrders = (orders) => {
        boardContainer.innerHTML = '';
        statusMessage.textContent = '';

        if (!orders || orders.length === 0) {
            statusMessage.textContent = 'ただいまお呼び出し中の番号はありません';
            return;
        }

        orders.sort((a, b) => a.orderId - b.orderId);

        orders.forEach(order => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket-number';
            ticketElement.textContent = order.orderId;
            boardContainer.appendChild(ticketElement);

            // 件数が増えたら1枚あたりを小さく表示する
            boardContainer.classList.remove('many-tickets', 'very-many-tickets');
            const ticketCount = orders.length;
            if (ticketCount >= 15) {
                boardContainer.classList.add('very-many-tickets');
            } else if (ticketCount >= 10) {
                boardContainer.classList.add('many-tickets');
            }
        });
    };

    const fetchAndUpdateBoard = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/get/byServingStatus/1`);

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

    fetchAndUpdateBoard();
    setInterval(fetchAndUpdateBoard, POLLING_INTERVAL);
});
