package com.cdmts.paymentApps.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/*
 * 店舗用UIの認証設定。
 *
 * パスワードは application.yaml に直接書かず、環境変数 ADMIN_PASSWORD から渡す。
 * このリポジトリは学祭後に公開される可能性があるため、平文をコミットしない。
 */
@Component
@ConfigurationProperties(prefix = "admin.auth")
@Getter
@Setter
@Slf4j
public class AdminAuthProperties {

	/*
	 * 認証を有効にするか。
	 * false にすると全リクエストが素通りする。当日に認証が原因で店舗が止まった場合の
	 * 逃げ道として用意しているだけで、通常は true のまま使う。
	 */
	private boolean enabled = true;

	/* 店舗共通のパスワード（ユーザー名は無い）。環境変数 ADMIN_PASSWORD で渡す */
	private String password;

	/*
	 * 起動時の設定チェック。
	 *
	 * パスワード未設定のまま起動できてしまうと、認証があるつもりで誰も入れない
	 * （あるいは空文字で入れる）状態に気づけないため、例外で落とす。
	 */
	@PostConstruct
	void validateOnStartup() {

		if (!enabled) {
			log.warn("=================================================================");
			log.warn(" 店舗用UIの認証が無効です (admin.auth.enabled=false)");
			log.warn(" paymentStatus の書き換えAPIが誰でも実行できる状態です。");
			log.warn(" 一時的な切り分け以外では使わないでください。");
			log.warn("=================================================================");
			return;
		}

		if (password == null || password.isBlank()) {
			throw new IllegalStateException(
					"admin.auth.password が未設定です。環境変数 ADMIN_PASSWORD を設定してください。"
					+ " 認証を意図的に止める場合は ADMIN_AUTH_ENABLED=false を指定してください。");
		}
	}
}
