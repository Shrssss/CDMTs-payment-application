document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = "/api";
    const POLLING_INTERVAL = 10000;
    const CANCEL_GRACE_PERIOD = 20000;

    const mainElement = document.querySelector('main');
    const readyOrdersContainer = document.getElementById('ready-orders-container');

    async function fetchReadyOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/get/byServingStatus/1`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('注文の取得に失敗しました:', error);
            return [];
        }
    }

    /**
     * @param {number} newStatus servingStatus。0=調理待ち / 1=受渡待ち / 2=受け渡し完了
     */
    async function patchOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/update/servingStatus/${orderId}/${newStatus}`, {
                method: 'PUT',
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

    function formatReserveTime(reservedTimeStr) {
        const reservedTime = new Date(reservedTimeStr);
        return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.dataset.orderId = order.orderId;

        const number = document.createElement('div');
        number.className = 'ticket-number';
        number.textContent = order.orderId;

        // 商品名は商品マスタ由来の値。innerHTML に流すとHTMLとして実行されるため textContent を使う
        const list = document.createElement('ul');
        list.className = 'order-items';
        for (const item of order.orderedItems ?? []) {
            const li = document.createElement('li');
            li.textContent = `${item.name} x ${item.quantity}`;
            list.appendChild(li);
        }

        const time = document.createElement('div');
        time.className = 'time-info';
        time.textContent = formatReserveTime(order.reservedTime);

        const details = document.createElement('div');
        details.className = 'order-details';
        details.append(list, time);

        const button = document.createElement('button');
        button.className = 'action-button complete-btn';
        button.textContent = '受け渡し完了';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        card.append(number, details, button, spinner);
        return card;
    }

    function renderOrders(orders) {
        const waitingIds = Object.keys(cancellationTimers);

        readyOrdersContainer.innerHTML = '';
        orders.sort((a, b) => a.orderId - b.orderId);

        function renderCard(order) {
            const card = createOrderCard(order);
            // ポーリングで作り直したときに、取り消し待ちの見た目を復元する
            if (waitingIds.includes(order.orderId.toString())) {
                const button = card.querySelector('.action-button');
                card.classList.add('waiting-cancellation');
                button.textContent = '取り消し';
                button.classList.add('cancel');
            }
            return card;
        }

        orders.forEach(order => readyOrdersContainer.appendChild(renderCard(order)));
    }

    let cancellationTimers = {};

    mainElement.addEventListener('click', async (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button')) {
            return;
        }
        const card = button.closest('.ticket-card');
        if (!card) return;

        const orderId = card.dataset.orderId;

        if (button.classList.contains('cancel')) {
            if (cancellationTimers[orderId]) {
                clearTimeout(cancellationTimers[orderId]);
                delete cancellationTimers[orderId];
                card.classList.remove('waiting-cancellation');
                button.textContent = '受け渡し完了';
                button.classList.remove('cancel');
            }
        } else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;

            card.classList.add('waiting-cancellation');
            button.textContent = '取り消し';
            button.classList.add('cancel');

            // 押し間違いを取り消せるよう、猶予をおいてからサーバーに送る
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';

                const result = await patchOrderStatus(orderId, 2);

                card.classList.remove('loading');

                if (result) {
                    card.remove();
                } else {
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '受け渡し完了';
                    button.classList.remove('cancel');
                }
                delete cancellationTimers[orderId];
            }, CANCEL_GRACE_PERIOD);

            cancellationTimers[orderId] = timerId;
        }
    });

    async function initialize() {
        const orders = await fetchReadyOrders();
        renderOrders(orders);

        setInterval(async () => {
            const latestOrders = await fetchReadyOrders();
            renderOrders(latestOrders);
        }, POLLING_INTERVAL);
    }

    initialize();
});
