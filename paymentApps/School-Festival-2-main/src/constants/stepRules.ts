// 画面ごとのフッター表示、ボタン文言、遷移制御の条件をまとめる定義ファイル。
import { STEPS, type Step } from "./steps";
import { RESERVATION_CONFIG } from "./config";
import { isPastLastOrderTime } from "../features/reservation/reservationSchedule";

export interface NextDisabledContext {
  numOfChosenMenu?: number;
  difference?: number;
  now?: Date;
}

export interface StepRule {
  showFooter: boolean;
  actionLabel?: string;
  nextDisabled?: (context: NextDisabledContext) => boolean;
}

const FOOTER_STEPS = new Set<Step>([STEPS.MENU, STEPS.DRINK, STEPS.CART, STEPS.TIME]);

export const STEP_RULES: Partial<Record<Step, StepRule>> = {
  [STEPS.TITLE]: {
    showFooter: false,
  },
  [STEPS.MENU]: {
    showFooter: true,
    nextDisabled: ({ numOfChosenMenu }) => numOfChosenMenu === 0,
  },
  [STEPS.DRINK]: {
    showFooter: true,
    nextDisabled: ({ difference }) => difference !== 0,
  },
  [STEPS.CART]: {
    showFooter: true,
  },
  [STEPS.TIME]: {
    showFooter: true,
    actionLabel: "注文確定",
    nextDisabled: ({ now }) => {
      if (!now) return false;
      return isPastLastOrderTime(now, RESERVATION_CONFIG);
    },
  },
  [STEPS.PAYMENT_METHOD]: {
    showFooter: false,
  },
  [STEPS.PAYMENT]: {
    showFooter: false,
  },
  [STEPS.PAYMENT_PAYPAY]: {
    showFooter: false,
  },
  [STEPS.PAYMENT_RESULT]: {
    showFooter: false,
  },
  [STEPS.NUMBER_TAG]: {
    showFooter: false,
  },
};

export const shouldShowFooter = (step: Step): boolean => FOOTER_STEPS.has(step);

export const getStepRule = (step: Step): StepRule =>
  STEP_RULES[step] || { showFooter: false };

export const getFooterActionLabel = (step: Step): string =>
  getStepRule(step).actionLabel || "次へ";

export const isFooterNextDisabled = (
  step: Step,
  context: NextDisabledContext
): boolean => {
  const rule = getStepRule(step);
  if (typeof rule.nextDisabled !== "function") {
    return false;
  }

  return rule.nextDisabled(context);
};
