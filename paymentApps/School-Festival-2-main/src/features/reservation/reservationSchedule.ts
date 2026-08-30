// 予約可能な時刻候補を生成し、受付終了時刻までの範囲を管理するロジック。

export interface ReservationConfig {
  START_OFFSET_MINUTES: number;
  LAST_ORDER_HOUR: number;
  LAST_ORDER_MINUTE: number;
  INTERVAL_MINUTES: number;
}

export interface TimeOption {
  value: string;
  label: string;
}

// 最終受付時刻(LAST_ORDER_HOUR:LAST_ORDER_MINUTE)を過ぎているかどうかを判定する。
// ちょうど最終受付時刻そのものは「受付終了」扱い(その時刻は含まない)。
// 予約候補の生成(このファイル)と、注文確定ボタンの無効化判定(stepRules.ts)の
// 両方がこの関数を共有する。片方だけ直して判定基準がずれる事故を防ぐため、
// 締切のhh:mm比較ロジックはこの関数以外に書かないこと。
export function isPastLastOrderTime(
  date: Date,
  reservationConfig: ReservationConfig
): boolean {
  const hour = date.getHours();
  const minutes = date.getMinutes();
  return (
    hour > reservationConfig.LAST_ORDER_HOUR ||
    (hour === reservationConfig.LAST_ORDER_HOUR &&
      minutes >= reservationConfig.LAST_ORDER_MINUTE)
  );
}

export function generateTimeOptions(
  now: Date,
  reservationConfig: ReservationConfig
): TimeOption[] {
  const startTargetTime = new Date(
    now.getTime() + reservationConfig.START_OFFSET_MINUTES * 60000
  );

  const minutes = startTargetTime.getMinutes();
  const minutesToRound = minutes % reservationConfig.INTERVAL_MINUTES;

  let roundedMinutes = minutes;
  if (minutesToRound !== 0) {
    roundedMinutes = minutes + (reservationConfig.INTERVAL_MINUTES - minutesToRound);
  }

  const startTime = new Date(startTargetTime);
  startTime.setMinutes(roundedMinutes);
  startTime.setSeconds(0, 0);
  startTime.setMilliseconds(0);

  const options: TimeOption[] = [];
  let currentTime = startTime;

  while (true) {
    if (isPastLastOrderTime(currentTime, reservationConfig)) {
      break;
    }

    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const timeString = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinutes
    ).padStart(2, "0")}`;
    options.push({ value: timeString, label: timeString });

    currentTime = new Date(
      currentTime.getTime() + reservationConfig.INTERVAL_MINUTES * 60000
    );
  }

  return options;
}
