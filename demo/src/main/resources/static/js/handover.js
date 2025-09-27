document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const API_BASE_URL = 'http://localhost:8080';
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    // ★ 変更点: 受け渡し画面用のコンテナを取得
    const readyOrdersContainer = document.getElementById('ready-orders-container');

    // --- API通信関数 ---

    /**
     * READY状態のチケットをサーバーから取得する
     * @returns {Promise<Array>} チケットデータの配列
     */
    // ★ 変更点: 関数名とAPIのクエリをREADY用に変更
    async function fetchReadyTickets() {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=READY`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの取得に失敗しました:', error);
            return [];
        }
    }

    /**
     * チケットのステータスを更新する (この関数は共通で利用)
     */
    async function patchTicketStatus(ticketId, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの更新に失敗しました:', error);
            alert('サーバーとの通信に失敗しました。時間をおいて再度お試しください。');
            return null;
        }
    }

    // --- UI描画関数 ---

    // ★ 変更点: 時刻を「XX:XX」形式で表示するシンプルな関数に変更
    function formatReserveTime(reserveAt) {
        const reservedTime = new Date(reserveAt);
        return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.dataset.ticketId = ticket.id;

        // ★ 変更点: is-urgent, is-overdueのクラス付与ロジックは不要なため削除

        const itemsList = ticket.items.map(item => `<li>${item.product_name} x ${item.quantity}</li>`).join('');

        // ★ 変更点: ボタンの文言と時刻表示の関数を変更
        card.innerHTML = `
            <div class="ticket-number">${ticket.ticket_number}</div>
            <div class="order-details">
                <ul class="order-items">${itemsList}</ul>
                <div class="time-info">${formatReserveTime(ticket.reserve_at)}</div>
            </div>
            <button class="action-button complete-btn">受け渡し完了</button>
            <div class="loading-spinner"></div>
        `;
        return card;
    }

    // ★ 変更点: 受け渡し画面用にrender関数をシンプル化
    function renderTickets(tickets) {
        readyOrdersContainer.innerHTML = '';

        // 要件通り、番号札の昇順でソート
        tickets.sort((a, b) => a.ticket_number - b.ticket_number);

        tickets.forEach(ticket => readyOrdersContainer.appendChild(createTicketCard(ticket)));
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
        const ticketId = card.dataset.ticketId;

        // (1) 「取り消し」ボタンがクリックされた場合
        if (button.classList.contains('cancel')) {
            if (cancellationTimers[ticketId]) {
                clearTimeout(cancellationTimers[ticketId]);
                delete cancellationTimers[ticketId];
                card.classList.remove('waiting-cancellation');
                // ★ 変更点: ボタンの文言を受け渡し画面用に変更
                button.textContent = '受け渡し完了';
                button.classList.remove('cancel');
            }
        }
        // (2) 「受け渡し完了」ボタンがクリックされた場合
        else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;
        
            card.classList.add('waiting-cancellation');
            // ★ 変更点: ボタンの文言を受け渡し画面用に変更
            button.textContent = '取り消し';
            button.classList.add('cancel');
    
            const timerId = setTimeout(async (id) => {
                card.classList.add('loading');
                button.style.display = 'none';
    
                // ★ 変更点: ステータスを 'DONE' に変更する
                const result = await patchTicketStatus(id, 'DONE');
                
                card.classList.remove('loading');
    
                if (result) {
                    card.remove();
                } else {
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    // ★ 変更点: ボタンの文言を受け渡し画面用に変更
                    button.textContent = '受け渡し完了';
                    button.classList.remove('cancel');
                }
                delete cancellationTimers[id];
            }, 5000, ticketId);
    
            cancellationTimers[ticketId] = timerId;
        }
    });

    // --- 初期化処理 ---
    async function initialize() {
        // ★ 変更点: READY状態のチケットを取得する関数を呼び出す
        const tickets = await fetchReadyTickets();
        renderTickets(tickets);
        
        setInterval(async () => {
            const latestTickets = await fetchReadyTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});