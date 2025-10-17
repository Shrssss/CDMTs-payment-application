document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const API_BASE_URL = "https://cdmts-pay.codemates.net/api";
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 ---

    /**
     * 調理中(servingStatus=0)の注文をサーバーから取得する
     * paymentStatusがtrueのみ返す
     * @returns {Promise<Array>} 注文データの配列
     */
    async function fetchCookingOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/order/get/bystatus/0`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            const orders = await response.json();
            // paymentStatusがtrueのみ残す
            return orders.filter(order => order.paymentStatus === true);
        } catch (error) {
            console.error('注文の取得に失敗しました:', error);
            return [];
        }
    }

    /**
     * orderIdで単一注文を取得する
     * @param {number|string} orderId
     * @returns {Promise<Object|null>} 注文データ（order.items含む）、失敗時はnull
     */
    async function fetchOrder(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/order/get/byorderId/${orderId}`);
            if (!response.ok) throw new Error(`APIエラー: ${response.status}`);
            const order = await response.json();
            return order; // order.items が含まれている
        } catch (error) {
            console.error('注文の取得に失敗しました:', error);
            return null;
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
            const response = await fetch(`${API_BASE_URL}/order/set/servingStatus/${orderId}/${newStatus}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        card.dataset.orderId = order.orderId;

        const now = new Date();
        const reservedTime = new Date(order.reservedTime);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) card.classList.add('is-overdue');
        else if (diffMinutes <= 10) card.classList.add('is-urgent');

        const itemsList = (order.items || []).map(item => `<li>${item.itemName} x ${item.quantity}</li>`).join('');

        card.innerHTML = `
            <div class="ticket-number">${order.orderId}</div>
            <div class="order-details">
                <div class="time-info">${getTimeInfoText(order.reservedTime)}</div>
                <ul class="order-items">${itemsList}</ul>
            </div>
            <button class="action-button complete-btn">調理完了</button>
            <div class="loading-spinner"></div>
        `;
        return card;
    }

    function renderOrders(orders) {
        const waitingIds = Object.keys(cancellationTimers);
        upcomingContainer.innerHTML = '';
        overdueContainer.innerHTML = '';
        const now = new Date();
        const upcomingOrders = orders.filter(o => new Date(o.reservedTime) >= now);
        const overdueOrders = orders.filter(o => new Date(o.reservedTime) < now);

        upcomingOrders.sort((a, b) => new Date(a.reservedTime) - new Date(b.reservedTime));
        overdueOrders.sort((a, b) => new Date(a.reservedTime) - new Date(b.reservedTime));

        function renderCard(order) {
            const card = createOrderCard(order);
            if (waitingIds.includes(order.orderId.toString())) {
                const button = card.querySelector('.action-button');
                card.classList.add('waiting-cancellation');
                button.textContent = '取り消し';
                button.classList.add('cancel');
            }
            return card;
        }

        upcomingOrders.forEach(order => upcomingContainer.appendChild(renderCard(order)));
        overdueOrders.forEach(order => overdueContainer.appendChild(renderCard(order)));
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

                const result = await patchOrderStatus(orderId, 1);

                card.classList.remove('loading');

                if (result) {
                    card.remove();
                } else {
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '調理完了';
                    button.classList.remove('cancel');
                }
                delete cancellationTimers[orderId];
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
