document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const API_BASE_URL = "https://dev-cdmts-pay.codemates.net/api";
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    const readyOrdersContainer = document.getElementById('ready-orders-container');

    // --- API通信関数 ---

    /**
     * 受け渡し準備完了(servingStatus=1)の注文をサーバーから取得する
     * @returns {Promise<Array>} 注文データの配列
     */
    async function fetchReadyOrders() {
        try {
            // ★ 変更点: URLをOrderTableに変更し、servingStatus=1でフィルタリング
            //const response = await fetch(`${API_BASE_URL}/OrderTable?servingStatus=1`);
			const response = await fetch(`${API_BASE_URL}/order/get/bystatus/1`);
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
     * 注文のステータスを更新する
     * @param {string|number} orderId 更新する注文のID
     * @param {number} newStatus 新しいステータス (2: DONEなど)
     * @returns {Promise<Object|null>} 更新後の注文データ、失敗時はnull
     */
    async function patchOrderStatus(orderId, newStatus) {
        try {
            // ★ 変更点: URLをOrderTable/{orderId}の形式に変更
            const response = await fetch(`${API_BASE_URL}/order/set/servingStatus/${orderId}/${newStatus}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ★ 変更点: statusをservingStatusに変更
                body: JSON.stringify({ servingStatus: newStatus }),
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

    function formatReserveTime(reservedTimeStr) {
        const reservedTime = new Date(reservedTimeStr);
        return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        // ★ 変更点: ticketIdをorderIdに変更
        card.dataset.orderId = order.orderId;

        // ★ 変更点: product_nameをitemNameに変更
        //const itemsList = order.items.map(item => `<li>${item.itemName} x ${item.quantity}</li>`).join('');
		const itemsList = (order.items || []).map(item => `<li>${item.itemName} x ${item.quantity}</li>`).join('');

        card.innerHTML = `
            <div class="ticket-number">${order.orderId}</div>
            <div class="order-details">
                <ul class="order-items">${itemsList}</ul>
                <div class="time-info">${formatReserveTime(order.reservedTime)}</div>
            </div>
            <button class="action-button complete-btn">受け渡し完了</button>
            <div class="loading-spinner"></div>
        `;
        return card;
    }

    function renderOrders(orders) {
		const waitingIds = Object.keys(cancellationTimers);　//追加
		
        readyOrdersContainer.innerHTML = '';

        // ★ 変更点: ticket_numberをorderIdでソート
        orders.sort((a, b) => a.orderId - b.orderId);

		function renderCard(order) {
        	const card = createOrderCard(order);
        	// 追加：「取り消し中」状態なら再現する
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
                button.textContent = '受け渡し完了';
                button.classList.remove('cancel');
            }
        }
        // (2) 「受け渡し完了」ボタンがクリックされた場合
        else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;
        
            card.classList.add('waiting-cancellation');
            button.textContent = '取り消し';
            button.classList.add('cancel');
    
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';
    
                // ★ 変更点: ステータスを 'DONE' から 2 に変更し、関数をpatchOrderStatusに変更
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
            // ★ 変更点: タイマーを1分に変更
            }, 60000);
    
            cancellationTimers[orderId] = timerId;
        }
    });

    // --- 初期化処理 ---
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
