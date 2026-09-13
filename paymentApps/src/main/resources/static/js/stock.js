document.addEventListener('DOMContentLoaded', () => {

    const baseURL = "/api";
    const POLLING_INTERVAL = 10000;

    // stock.html?mock=1 のときだけ使う確認用データ。
    // 定数で切り替える方式にすると、オンのまま本番に上げる事故が起きうるためURLで指定する。
    const USE_MOCK = new URLSearchParams(location.search).get('mock') === '1';
    const MOCK_ITEMS = [
        { itemId: 10, itemName: '角煮 単品',              price: 500, imagePath: null, available: true  },
        { itemId: 20, itemName: '角煮大盛り 単品',         price: 700, imagePath: null, available: true  },
        { itemId: 30, itemName: 'ドリンク単品',            price: 150, imagePath: null, available: true  },
        { itemId: 40, itemName: '角煮ドリンクセット',       price: 600, imagePath: null, available: false },
        { itemId: 50, itemName: '角煮ドリンクセット大盛り', price: 800, imagePath: null, available: true  },
        { itemId: 91, itemName: 'コーラ',                 price: 0,   imagePath: null, available: true  },
        { itemId: 92, itemName: 'なっちゃんオレンジ',      price: 0,   imagePath: null, available: true  },
        { itemId: 93, itemName: '三ツ矢サイダー',          price: 0,   imagePath: null, available: true  },
        { itemId: 94, itemName: '烏龍茶',                 price: 0,   imagePath: null, available: false },
    ];

    const itemListElement = document.getElementById('item-list');
    const errorMessageElement = document.getElementById('error-message');

    const showError = (message) => {
        errorMessageElement.textContent = message;
    };

    const fetchItems = async () => {
        if (USE_MOCK) return MOCK_ITEMS;

        const response = await fetch(`${baseURL}/items/get/allItems`);
        if (!response.ok) {
            throw new Error(`APIからのデータ取得に失敗 (HTTP: ${response.status})`);
        }
        return response.json();
    };

    const createItemCard = (item) => {
        const card = document.createElement('div');
        card.className = 'item-card';

        // 商品名は商品マスタ由来の値。innerHTML に流すとHTMLとして実行されるため textContent を使う
        const name = document.createElement('span');
        name.className = 'item-name';
        name.textContent = item.itemName;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'availability-toggle';
        input.dataset.id = item.itemId;
        input.checked = item.available;

        const slider = document.createElement('span');
        slider.className = 'slider';

        const label = document.createElement('label');
        label.className = 'switch';
        label.append(input, slider);

        card.append(name, label);
        return card;
    };

    const renderItems = async () => {
        try {
            const items = await fetchItems();
            itemListElement.replaceChildren(...items.map(createItemCard));
            showError('');
        } catch (error) {
            console.error('商品一覧の取得に失敗:', error);
            // 取得できないまま古い表示を残すと、売り切れた商品を在庫ありと誤認して売ってしまう
            itemListElement.replaceChildren();
            showError('商品一覧を取得できませんでした。ページを再読み込みしてください。');
        }
    };

    // カードごと作り直すと、店員が操作中のクリックを取りこぼすのでトグルの状態だけ更新する
    const syncToggleStates = async () => {
        try {
            const items = await fetchItems();
            for (const item of items) {
                const toggle = itemListElement.querySelector(
                    `.availability-toggle[data-id="${item.itemId}"]`
                );
                if (toggle) toggle.checked = item.available;
            }
            showError('');
        } catch (error) {
            console.error('在庫状況の同期に失敗:', error);
            showError('最新の在庫状況を取得できませんでした。表示が古い可能性があります。');
        }
    };

    // カードは描画のたびに作り直されるので、個々のトグルではなく親で受ける
    itemListElement.addEventListener('change', async (event) => {
        const toggle = event.target;
        if (!toggle.classList.contains('availability-toggle')) return;

        const itemId = toggle.dataset.id;
        const newAvailability = toggle.checked;

        try {
            const response = await fetch(
                `${baseURL}/items/update/available/${newAvailability}?itemIds=${itemId}`,
                { method: 'PUT' }
            );
            if (!response.ok) {
                throw new Error(`APIでの更新に失敗 (HTTP: ${response.status})`);
            }
            showError('');
        } catch (error) {
            console.error('更新エラー:', error);
            showError('サーバーとの通信に失敗し、状態を更新できませんでした。');
            toggle.checked = !newAvailability;
        }
    });

    renderItems();
    setInterval(syncToggleStates, POLLING_INTERVAL);
});
