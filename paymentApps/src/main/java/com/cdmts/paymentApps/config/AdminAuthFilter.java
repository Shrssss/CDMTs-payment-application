package com.cdmts.paymentApps.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

/*
 * 店舗用UIと店舗用APIへのアクセスをセッションで制限するフィルタ。
 *
 * Interceptor ではなく Filter にしているのは、静的ファイル（HTML）とAPIを
 * 同じ1箇所で判定するため。Interceptor はハンドラ解決の後に動くので、
 * 静的リソースとAPIで扱いが分かれてしまう。
 */
@Component
@RequiredArgsConstructor
public class AdminAuthFilter extends OncePerRequestFilter {

	/* ログイン済みであることを示すセッション属性のキー */
	public static final String SESSION_KEY = "adminAuthenticated";

	private static final String LOGIN_PAGE = "/login.html";

	/*
	 * 認証なしで通すAPI。
	 *
	 * ここに書いていない /api/** は認証必須になる（デフォルト拒否）。
	 * エンドポイントが増えたときに書き漏れても「無防備」ではなく「401」側に倒れるため。
	 *
	 * 下の一覧は客用フロント（School-Festival-2）が呼んでいるものと、
	 * ログイン自体に必要なものだけ。ここを増やすときは客用が本当に使うか確認する。
	 */
	private static final List<Rule> PUBLIC_API = List.of(
			new Rule("GET",  "/api/items/get/allItems"),
			new Rule("GET",  "/api/items/get/byItemIds"),
			new Rule("GET",  "/api/square/config"),
			new Rule("GET",  "/api/orders/get/byOrderIds"),
			new Rule("GET",  "/api/orders/get/servingStatus/*"),
			new Rule("POST", "/api/orders/set"),
			new Rule("POST", "/api/payments/create/**"),
			new Rule("POST", "/api/admin/login"),
			new Rule("POST", "/api/admin/logout"),
			new Rule("GET",  "/api/admin/session"));

	/*
	 * 認証なしで表示できるページ。
	 * これ以外の .html は全部ログインが必要になる（こちらもデフォルト拒否）。
	 *
	 * /js/** と /css/** は対象外＝公開のまま。パスワードはサーバー側にしか無いので
	 * 店舗用JSに秘密は含まれず、保護するとログイン画面の読み込み順で問題が出る。
	 */
	private static final Set<String> PUBLIC_PAGES = Set.of("/", "/index.html", LOGIN_PAGE);

	/* ログイン後の戻り先として許可するページ。オープンリダイレクト防止のためサーバー側でも検査する */
	private static final Set<String> ADMIN_PAGES =
			Set.of("/monitor.html", "/stock.html", "/handover.html", "/cooking.html");

	private static final AntPathMatcher MATCHER = new AntPathMatcher();

	private final AdminAuthProperties properties;

	private record Rule(String method, String pattern) {
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {

		if (!properties.isEnabled()) {
			chain.doFilter(request, response);
			return;
		}

		/*
		 * CORS の preflight は素通りさせる。
		 * OPTIONS を401で弾くと、客用フロントが本命のリクエストを送る前にCORSエラーで止まる。
		 */
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			chain.doFilter(request, response);
			return;
		}

		String path = pathOf(request);

		if (path.startsWith("/api/") && hasAmbiguousEncoding(request.getRequestURI())) {
			response.sendError(HttpServletResponse.SC_BAD_REQUEST);
			return;
		}

		if (!requiresAuth(request.getMethod(), path) || isAuthenticated(request)) {
			chain.doFilter(request, response);
			return;
		}

		deny(response, path);
	}

	/*
	 * 判定に使うパス（コンテキストパスを除いたもの）。
	 *
	 * getRequestURI() は生の値なので使わない。生の値は「;jsessionid=...」のような
	 * パスパラメータや %61 のようなエスケープを含んだままで、Tomcat がルーティングに使う
	 * 正規化後のパスと食い違う。食い違うと /api;x=y/orders/... が "/api/" で始まらないと
	 * 判定されて素通りする（診断 vuln-0009）。
	 * getServletPath() + getPathInfo() は Tomcat が ; の除去・デコード・.. の解決を
	 * 済ませた値なので、実際に呼ばれるハンドラと同じパスで判定できる。
	 */
	private String pathOf(HttpServletRequest request) {

		String servletPath = request.getServletPath();
		String pathInfo = request.getPathInfo();
		String path = (servletPath == null ? "" : servletPath) + (pathInfo == null ? "" : pathInfo);

		return path.isEmpty() ? "/" : path;
	}

	/*
	 * 正規の客用・店舗用フロントが送らない書き方をAPIで拒否する。
	 * 上の正規化で判定のずれは無くなっているが、すり抜けを狙う形そのものを入口で落としておく。
	 */
	private boolean hasAmbiguousEncoding(String rawUri) {

		String lower = rawUri.toLowerCase(Locale.ROOT);

		return lower.contains(";") || lower.contains("%2e") || lower.contains("%2f") || lower.contains("%5c");
	}

	private boolean requiresAuth(String method, String path) {

		if (path.startsWith("/api/")) {
			return PUBLIC_API.stream().noneMatch(rule ->
					rule.method().equalsIgnoreCase(method) && MATCHER.match(rule.pattern(), path));
		}

		if (path.equals("/") || path.endsWith(".html")) {
			return !PUBLIC_PAGES.contains(path);
		}

		/* js / css / 画像 / manifest などの静的ファイル */
		return false;
	}

	private boolean isAuthenticated(HttpServletRequest request) {

		HttpSession session = request.getSession(false);

		return session != null && Boolean.TRUE.equals(session.getAttribute(SESSION_KEY));
	}

	/*
	 * 拒否の返し方をページとAPIで分ける。
	 *
	 * APIに 302 を返すと、fetch がリダイレクトを自動で追ってログインHTMLを 200 で受け取り、
	 * 呼び出し側が「成功」と誤認する。APIには必ず 401 を返す。
	 */
	private void deny(HttpServletResponse response, String path) throws IOException {

		if (ADMIN_PAGES.contains(path)) {
			response.sendRedirect(LOGIN_PAGE + "?next=" + URLEncoder.encode(path, StandardCharsets.UTF_8));
			return;
		}

		if (path.endsWith(".html") || path.equals("/")) {
			response.sendRedirect(LOGIN_PAGE);
			return;
		}

		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType("application/json;charset=UTF-8");
		response.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"ログインが必要です\"}");
	}
}
