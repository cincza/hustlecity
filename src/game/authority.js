import { isOnlineAlphaMode } from "./modes";

export function blockIfOnlineAlpha(mode, pushLog, featureLabel) {
  if (!isOnlineAlphaMode(mode)) {
    return false;
  }

  pushLog(
    `${featureLabel} jest chwilowo zablokowane w online alpha, dopoki backend nie liczy tego w pelni serwerowo.`
  );
  return true;
}
