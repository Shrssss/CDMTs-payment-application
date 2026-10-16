document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = "/api";

    // 「前の画面に戻る」の行き先として許可するページと、その表示名。
    // next はURLから来るので、検査せずにリンクへ入れると
    // //evil.example のような値で外部サイトへ飛ばされる（オープンリダイレクト）
    const ALLOWED_NEXT = {
        '/monitor.html': '呼び出しモニター',
        '/cooking.html': '調理',
        '/handover.html': '受け渡し',
        '/stock.html': '在庫'
    };

    const loginForm = document.getElementById('login-form');
    const loggedInBox = document.getElementById('logged-in');
    const backLink = document.getElementById('back-link');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const messageElement = document.getElementById('message');

    const showMessage = (text, isError = true) => {
        messageElement.textContent = text;
        messageElement.classList.toggle('is-error', isError);
    };

    /*
     * ログイン後は next の画面へ直接飛ばさず、必ずこのリンク集を出す。
     * 直接飛ばすと、店舗用画面からリンク集へ戻る導線が無いため、他の画面を開けなくなる。
     * 元の画面へはここに出す「前の画面に戻る」から1タップで戻れる。
     */
    const showBackLink = () => {
        const requested = new URLSearchParams(location.search).get('next');

        if (!Object.hasOwn(ALLOWED_NEXT, requested)) {
            backLink.hidden = true;
            return;
        }

        backLink.href = requested;
        backLink.textContent = `← 前の画面に戻る（${ALLOWED_NEXT[requested]}）`;
        backLink.hidden = false;
    };

    // ログイン済みの人がこの画面を開いた場合は、フォームではなく行き先とログアウトを出す
    const showCurrentState = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/session`);
            const body = await response.json();
            const authenticated = body.authenticated === true;

            loginForm.hidden = authenticated;
            loggedInBox.hidden = !authenticated;

            if (authenticated) {
                showBackLink();
            } else {
                passwordInput.focus();
            }
        } catch (error) {
            // 状態が取れなくてもログインはできるので、フォームを出して続行する
            console.error('ログイン状態の確認に失敗:', error);
            loginForm.hidden = false;
            loggedInBox.hidden = true;
        }
    };

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        submitButton.disabled = true;
        showMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput.value })
            });

            if (response.ok) {
                passwordInput.value = '';
                await showCurrentState();
                return;
            }

            const body = await response.json().catch(() => ({}));

            if (response.status === 429) {
                const seconds = body.retryAfterSeconds ?? 30;
                showMessage(`入力を間違えすぎました。${seconds}秒ほど待ってからもう一度お試しください。`);
            } else if (response.status === 401) {
                showMessage('パスワードが違います。');
            } else {
                showMessage(`ログインできませんでした (HTTP: ${response.status})`);
            }

            passwordInput.value = '';
            passwordInput.focus();
        } catch (error) {
            console.error('ログインに失敗:', error);
            showMessage('サーバーに接続できませんでした。');
        } finally {
            submitButton.disabled = false;
        }
    });

    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;

        try {
            await fetch(`${API_BASE_URL}/admin/logout`, { method: 'POST' });
            showMessage('ログアウトしました。', false);
        } catch (error) {
            console.error('ログアウトに失敗:', error);
            showMessage('ログアウトできませんでした。');
        } finally {
            logoutButton.disabled = false;
            await showCurrentState();
        }
    });

    showCurrentState();
});
