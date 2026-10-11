package com.cdmts.paymentApps.controller;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmts.paymentApps.config.AdminAuthFilter;
import com.cdmts.paymentApps.config.AdminAuthProperties;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/*
 * 店舗用UIのログイン。
 *
 * ユーザー名は無く、店舗共通のパスワード1つで認証する。
 * 成功するとセッションに印を付け、以降は AdminAuthFilter がそれを見て通す。
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminAuthController {

	/*
	 * 連続失敗の上限とロック時間。
	 *
	 * 以前は20回で5分のロックもあったが、プロキシの後ろでは全端末が1つの枠を共有するため、
	 * 外部から20回間違えるだけで店舗全体が5分ログインできなくなっていた（診断 vuln-0007）。
	 * 最悪でも30秒で解けるよう、短いロックだけにしている。
	 */
	private static final int LOCK_THRESHOLD = 5;
	private static final long LOCK_MILLIS = 30_000L;

	/* 掃除の目安。これを超えたら古い記録を捨てる */
	private static final int PRUNE_THRESHOLD = 256;
	private static final long PRUNE_AGE_MILLIS = 3_600_000L;

	private final AdminAuthProperties properties;

	/*
	 * IPごとのログイン失敗記録。
	 *
	 * 学祭の1日だけ動けばよいのでDBには持たず、メモリに置く（再起動で消えてよい）。
	 */
	private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

	public record LoginRequest(String password) {
	}

	private static final class Attempt {
		private int failures;
		private long lockedUntil;
		private long lastFailureAt;
	}

	@PostMapping("/login")
	public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest body, HttpServletRequest request) {

		String clientIp = clientIpOf(request);

		long retryAfter = lockedSecondsRemaining(clientIp);
		if (retryAfter > 0) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
					.header("Retry-After", String.valueOf(retryAfter))
					.body(Map.of("error", "too_many_attempts", "retryAfterSeconds", retryAfter));
		}

		if (!matchesPassword(body == null ? null : body.password())) {
			recordFailure(clientIp);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "invalid_password"));
		}

		attempts.remove(clientIp);

		/*
		 * セッション固定化攻撃への対策。
		 * ログイン前のセッションIDをそのまま使い続けると、あらかじめIDを仕込まれていた場合に
		 * その相手もログイン済みとして扱われてしまう。
		 */
		HttpSession session = request.getSession(true);
		request.changeSessionId();
		session.setAttribute(AdminAuthFilter.SESSION_KEY, Boolean.TRUE);

		return ResponseEntity.ok(Map.of("authenticated", true));
	}

	@PostMapping("/logout")
	public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {

		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}

		return ResponseEntity.ok(Map.of("authenticated", false));
	}

	/* 画面側がログイン状態を確認するための問い合わせ。認証は要らない */
	@GetMapping("/session")
	public Map<String, Object> session(HttpServletRequest request) {

		HttpSession session = request.getSession(false);
		boolean authenticated =
				session != null && Boolean.TRUE.equals(session.getAttribute(AdminAuthFilter.SESSION_KEY));

		return Map.of("authenticated", authenticated);
	}

	/*
	 * パスワードの照合。
	 *
	 * String.equals は先頭から1文字ずつ比べて違いが出た時点で打ち切るため、
	 * 応答時間の差から1文字ずつ言い当てられる。長さによらず同じ時間で比べる。
	 */
	private boolean matchesPassword(String input) {

		if (input == null) {
			return false;
		}

		return MessageDigest.isEqual(
				input.getBytes(StandardCharsets.UTF_8),
				properties.getPassword().getBytes(StandardCharsets.UTF_8));
	}

	/*
	 * 接続元IP。
	 *
	 * リバースプロキシの後ろに置くと全部プロキシのIPに見えるため、その場合は
	 * 下のロックが「全端末で1つの枠を共有」になる。ロック時間を30秒と短くしてあるのは
	 * そのときに店舗が長時間止まらないようにするため。
	 * 根本対策の server.forward-headers-strategy は共有の application.yaml の変更になるので、
	 * 本番構成の確認と合わせて依頼中（learning/notes/asks.md）。
	 */
	private String clientIpOf(HttpServletRequest request) {

		String remoteAddr = request.getRemoteAddr();

		return remoteAddr == null ? "unknown" : remoteAddr;
	}

	private long lockedSecondsRemaining(String clientIp) {

		Attempt attempt = attempts.get(clientIp);
		if (attempt == null) {
			return 0L;
		}

		synchronized (attempt) {
			long remaining = attempt.lockedUntil - System.currentTimeMillis();
			return remaining > 0 ? (remaining + 999L) / 1000L : 0L;
		}
	}

	private void recordFailure(String clientIp) {

		Attempt attempt = attempts.computeIfAbsent(clientIp, key -> new Attempt());
		int failures;

		synchronized (attempt) {
			attempt.failures++;
			attempt.lastFailureAt = System.currentTimeMillis();
			failures = attempt.failures;

			if (failures >= LOCK_THRESHOLD) {
				attempt.lockedUntil = attempt.lastFailureAt + LOCK_MILLIS;
			}
		}

		if (failures == LOCK_THRESHOLD) {
			log.warn("ログイン失敗が{}回に達したため {} を一時的に締め出しました", failures, clientIp);
		}

		pruneIfCrowded();
	}

	/* 失敗記録が際限なく溜まらないよう、古いものを捨てる */
	private void pruneIfCrowded() {

		if (attempts.size() <= PRUNE_THRESHOLD) {
			return;
		}

		long threshold = System.currentTimeMillis() - PRUNE_AGE_MILLIS;

		attempts.values().removeIf(attempt -> {
			synchronized (attempt) {
				return attempt.lastFailureAt < threshold && attempt.lockedUntil < System.currentTimeMillis();
			}
		});
	}
}
