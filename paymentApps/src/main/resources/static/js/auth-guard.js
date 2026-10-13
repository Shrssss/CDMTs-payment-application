/*
 * 店舗用4画面が共通で使う fetch のラッパー。
 *
 * 各画面は5〜10秒ごとにポーリングしているので、セッションが切れると
 * 「エラー表示のまま延々と叩き続ける」状態になる。それを防いでログイン画面へ送る。
 *
 * type="module" にしていないのは、既存4本が素の同期スクリプトのままだから。
 * 読み込み順の都合で、各画面のJSより前に置く必要がある。
 */
(() => {
    'use strict';

    const SESSION_CHECK_INTERVAL = 30000;

    // ポーリングと遅延送信が同時に401を受けることがあるので、遷移は一度だけにする
    let redirecting = false;

    const goToLogin = () => {
        if (redirecting) return;
        redirecting = true;
        location.replace('/login.html?next=' + encodeURIComponent(location.pathname));
    };

    /**
     * fetch と同じ引数・同じ戻り値。認証切れのときだけログイン画面へ送る。
     *
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    window.apiFetch = async (url, options) => {
        const response = await fetch(url, options);

        if (response.status !== 401 && response.status !== 403) {
            return response;
        }

        goToLogin();

        // 呼び出し元に結果を返さずにここで打ち切る。
        // 返すと各画面の catch が「サーバーとの通信に失敗しました」と alert を出し、
        // その alert が確認されるまでページ遷移が止まる。
        // 原因はネットワークではなくログイン切れなので、その表示自体が誤解を招く。
        return new Promise(() => {});
    };

    /*
     * ログイン状態そのものを定期的に見に行く。
     *
     * 401 を待つだけでは stock.html が取り残される。あの画面のポーリングが叩くのは
     * GET /api/items/get/allItems で、客用アプリと共有しているため認証不要にしてある。
     * つまり 401 が返ってこず、セッションが切れても古い在庫表示を出し続けてしまう。
     * 売り切れた商品を「在庫あり」と誤認して売るのを避けたいので、こちらからも確認する。
     */
    const checkSession = async () => {
        try {
            const response = await fetch('/api/admin/session');
            const body = await response.json();

            if (body.authenticated !== true) goToLogin();
        } catch (error) {
            // 通信できないだけならログイン切れとは限らないので、ここでは何もしない
            console.error('ログイン状態の確認に失敗:', error);
        }
    };

    setInterval(checkSession, SESSION_CHECK_INTERVAL);
})();
