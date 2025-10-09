document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const API_BASE_URL = process.env.API_BASE_URL;
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 ---

    /**
     * 調理中(servingStatus=0)の注文をサーバーから取得する
     * @returns {Promise<Array>} 注文データの配列
     */
    async function fetchCookingOrders() {
        try {
            // ★ 変更点: URLをOrderTableに変更し、servingStatus=0でフィルタリング
            const response = await fetch(`${API_BASE_URL}/OrderTable?servingStatus=0`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('注文の取得に失敗しました:', error);
            // 画面の表示を止めないように、エラー時は空配列を返す
            return [];
        }
    }

    /**
     * 注文のステータスを更新する
     * @param {string|number} orderId 更新する注文のID
     * @param {number} newStatus 新しいステータス (1: READY, 2: DONEなど)
     * @returns {Promise<Object|null>} 更新後の注文データ、失敗時はnull
     */
    async function patchOrderStatus(orderId, newStatus) {
        try {
            // ★ 変更点: URLをOrderTable/{orderId}の形式に変更
            const response = await fetch(`${API_BASE_URL}/OrderTable/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                // ★ 変更点: statusをservingStatusに変更
                body: JSON.stringify({
                    servingStatus: newStatus,
                }),
            });
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('注文の更新に失敗しました:', error);
            alert('サーバーとの通信に失敗しました。時間をおいて再度お試しください。');
            return null;
        }
    }

    // --- UI描画関数 ---
    function getTimeInfoText(reservedTimeStr) {
        const now = new Date();
        const reservedTime = new Date(reservedTimeStr);
        const diffMinutes = Math.round((reservedTime - now) / (1000 * 60));
        if (diffMinutes > 0) {
            return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} まであと ${diffMinutes} 分`;
        } else {
            return `経過: ${-diffMinutes} 分`;
        }
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        // ★ 変更点: ticketIdをorderIdに変更
        card.dataset.orderId = order.orderId;

        const now = new Date();
        // ★ 変更点: reserve_atをreservedTimeに変更
        const reservedTime = new Date(order.reservedTime);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) card.classList.add('is-overdue');
        else if (diffMinutes <= 5) card.classList.add('is-urgent');

        // ★ 変更点: product_nameをitemNameに変更
        const itemsList = order.items.map(item => `<li>${item.itemName} x ${item.quantity}</li>`).join('');

        card.innerHTML = `
            <div class="ticket-number">${order.orderId}</div>
            <div class="order-details">
                <ul class="order-items">${itemsList}</ul>
                <div class="time-info">${getTimeInfoText(order.reservedTime)}</div>
            </div>
            <button class="action-button complete-btn">調理完了</button>
            <div class="loading-spinner"></div>
        `;
        return card;
    }

    function renderOrders(orders) {
        upcomingContainer.innerHTML = '';
        overdueContainer.innerHTML = '';
        const now = new Date();
        // ★ 変更点: reserve_atをreservedTimeに変更
        const upcomingOrders = orders.filter(o => new Date(o.reservedTime) >= now);
        const overdueOrders = orders.filter(o => new Date(o.reservedTime) < now);
        // ★ 変更点: reserve_atをreservedTimeに変更
        upcomingOrders.sort((a, b) => new Date(a.reservedTime) - new Date(b.reservedTime));
        overdueOrders.sort((a, b) => new Date(a.reservedTime) - new Date(b.reservedTime));

        upcomingOrders.forEach(order => upcomingContainer.appendChild(createOrderCard(order)));
        overdueOrders.forEach(order => overdueContainer.appendChild(createOrderCard(order)));
    }

    // --- イベントハンドラ ---
    let cancellationTimers = {};

    mainElement.addEventListener('click', async (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button')) {
            return;
        }

        const card = button.closest('.ticket-card');
        if (!card) return;

        // ★ 変更点: ticketIdをorderIdに変更
        const orderId = card.dataset.orderId;

        // (1) 「取り消し」ボタンがクリックされた場合
        if (button.classList.contains('cancel')) {
            if (cancellationTimers[orderId]) {
                clearTimeout(cancellationTimers[orderId]);
                delete cancellationTimers[orderId];

                card.classList.remove('waiting-cancellation');
                button.textContent = '調理完了';
                button.classList.remove('cancel');
            }
        }
        // (2) 「調理完了」ボタンがクリックされた場合
        else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;

            card.classList.add('waiting-cancellation');
            button.textContent = '取り消し';
            button.classList.add('cancel');

            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';

                // ★ 変更点: patchTicketStatusをpatchOrderStatusに変更、ステータスを'READY'から1に変更
                const result = await patchOrderStatus(orderId, 1);

                card.classList.remove('loading');

                if (result) {
                    // API通信が成功したらカードを削除
                    card.remove();
                } else {
                    // 失敗した場合はボタンと表示を元に戻す
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '調理完了';
                    button.classList.remove('cancel');
                }
                delete cancellationTimers[orderId];
            // ★ 変更点: タイマーを1分に変更
            }, 60000);

            cancellationTimers[orderId] = timerId;
        }
    });

    // --- 初期化処理 ---
    async function initialize() {
        const orders = await fetchCookingOrders();
        renderOrders(orders);

        setInterval(async () => {
            const latestOrders = await fetchCookingOrders();
            renderOrders(latestOrders);
        }, POLLING_INTERVAL);
    }

    initialize();
});