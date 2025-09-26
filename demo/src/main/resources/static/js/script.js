document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const API_BASE_URL = '/api/v1'; // APIのベースURL（環境に合わせて変更）
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // --- DOM要素の取得 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 ---

    /**
     * COOKING状態のチケットをサーバーから取得する
     * @returns {Promise<Array>} チケットデータの配列
     */
    async function fetchCookingTickets() {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=COOKING`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの取得に失敗しました:', error);
            // 実際には画面上にエラーメッセージを表示する方が親切
            return []; // エラー時は空配列を返す
        }
    }

    /**
     * チケットのステータスを更新する
     * @param {string} ticketId 更新するチケットのID
     * @param {string} newStatus 新しいステータス ('READY'など)
     * @returns {Promise<Object|null>} 更新後のチケットデータ、失敗時はnull
     */
    async function patchTicketStatus(ticketId, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの更新に失敗しました:', error);
            alert('チケットの更新に失敗しました。'); // [cite: 241]
            return null;
        }
    }

    // --- UI描画関数 ---

    /**
     * 予約時刻と現在時刻の差を計算して文字列を返す
     * @param {string} reserveAt - 予約時刻 (ISO 8601形式)
     * @returns {string} 表示用の時間文字列
     */
    function getTimeInfoText(reserveAt) {
        const now = new Date();
        const reservedTime = new Date(reserveAt);
        const diffMinutes = Math.round((reservedTime - now) / (1000 * 60));

        if (diffMinutes > 0) {
            return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} まであと ${diffMinutes} 分`;
        } else {
            return `経過: ${-diffMinutes} 分`; // [cite: 218]
        }
    }

    /**
     * チケットデータからHTML要素を作成する
     * @param {Object} ticket - チケットデータ
     * @returns {HTMLElement} チケットカードのDOM要素
     */
    function createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.dataset.ticketId = ticket.ticket_id;

        // 予約時刻に応じてクラスを追加 
        const now = new Date();
        const reservedTime = new Date(ticket.reserve_at);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) {
            card.classList.add('is-overdue');
        } else if (diffMinutes <= 5) {
            card.classList.add('is-urgent');
        }

        // 注文内容のリストを作成
        const itemsList = ticket.items.map(item => `<li>${item.product_name} x ${item.quantity}</li>`).join('');

        card.innerHTML = `
            <div class="ticket-number">${ticket.ticket_number}</div>
            <div class="order-details">
                <ul class="order-items">${itemsList}</ul>
                <div class="time-info">${getTimeInfoText(ticket.reserve_at)}</div>
            </div>
            <button class="action-button complete-btn">調理完了</button>
            <div class="loading-spinner"></div>
        `;

        const completeButton = card.querySelector('.complete-btn');
        completeButton.addEventListener('click', () => handleCompleteCookingClick(ticket.ticket_id, card));
        
        return card;
    }

    /**
     * チケット一覧を画面に描画する
     * @param {Array<Object>} tickets - チケットデータの配列
     */
    function renderTickets(tickets) {
        // コンテナをクリア
        upcomingContainer.innerHTML = '';
        overdueContainer.innerHTML = '';
        
        const now = new Date();
        
        // 予約時刻が未来のものと過去のもので振り分ける [cite: 219]
        const upcomingOrders = tickets.filter(t => new Date(t.reserve_at) >= now);
        const overdueOrders = tickets.filter(t => new Date(t.reserve_at) < now);

        // 予約時刻が近い順にソート [cite: 222]
        upcomingOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));
        // 予約時刻が古い順にソート [cite: 222]
        overdueOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));

        upcomingOrders.forEach(ticket => upcomingContainer.appendChild(createTicketCard(ticket)));
        overdueOrders.forEach(ticket => overdueContainer.appendChild(createTicketCard(ticket)));
    }


    // --- イベントハンドラ ---
    
    // 各カードに紐づくタイマーIDを管理するオブジェクト
    let cancellationTimers = {};

    /**
     * 「調理完了」ボタンクリック時の処理
     * @param {string} ticketId - チケットID
     * @param {HTMLElement} cardElement - 対応するカード要素
     */
    function handleCompleteCookingClick(ticketId, cardElement) {
        // すでに取り消し待ち状態なら何もしない
        if (cardElement.classList.contains('waiting-cancellation')) return;
        
        cardElement.classList.add('waiting-cancellation'); // [cite: 225]
        const button = cardElement.querySelector('.action-button');
        button.textContent = '取り消し'; // [cite: 226]
        button.classList.add('cancel'); // [cite: 227]

        // 5秒後にAPIを叩くタイマーをセット 
        const timerId = setTimeout(async () => {
            // タイマーが発火したら、ローディング表示に切り替え [cite: 236]
            cardElement.classList.add('loading');
            button.style.display = 'none'; // ボタンを隠す

            const result = await patchTicketStatus(ticketId, 'READY');
            
            cardElement.classList.remove('loading'); // ローディング解除 [cite: 240]

            if (result) {
                // API通信成功時、カードを画面から削除 [cite: 235]
                cardElement.remove();
            } else {
                // API通信失敗時、カードを元の状態に戻す [cite: 240]
                button.style.display = 'block'; // ボタンを再表示
                cardElement.classList.remove('waiting-cancellation');
                button.textContent = '調理完了';
                button.classList.remove('cancel');
            }
            delete cancellationTimers[ticketId];
        }, 5000);

        cancellationTimers[ticketId] = timerId;
    }

    /**
     * 「取り消し」ボタンクリック時の処理（イベント委譲を利用）
     */
    document.body.addEventListener('click', (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button') || !button.classList.contains('cancel')) {
            return;
        }
        
        const card = button.closest('.ticket-card');
        const ticketId = card.dataset.ticketId;
        
        if (cancellationTimers[ticketId]) {
            clearTimeout(cancellationTimers[ticketId]); // タイマーをキャンセル [cite: 230]
            delete cancellationTimers[ticketId];

            // カードとボタンを元の状態に戻す [cite: 231]
            card.classList.remove('waiting-cancellation');
            button.textContent = '調理完了';
            button.classList.remove('cancel');
        }
    });


    // --- 初期化処理 ---
    
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);

        // 定期的にデータを更新
        setInterval(async () => {
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});