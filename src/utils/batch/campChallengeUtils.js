export function getCampChallengeSuccessLimit(settings = {}) {
  return Number(settings.campChallengeSuccessLimit) === 5 ? 5 : 3;
}

export function getCampChallengeSuccessCount(todayAttack = {}) {
  const count = Number(todayAttack.aSuccessCnt);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function isCampChallengeDailyLimitError(error, operation) {
  if (operation !== "challenge") return false;
  const code = Number(error?.code ?? error?.errorCode);
  return code === 13000090 || /(?:^|\D)13000090(?:\D|$)/.test(error?.message || String(error));
}
