import assert from "node:assert/strict";
import test from "node:test";
import {
  getCampChallengeSuccessLimit,
  getCampChallengeSuccessCount,
  isCampChallengeDailyLimitError,
} from "../src/utils/batch/campChallengeUtils.js";

test("默认营地成功挑战上限为3次", () => {
  assert.equal(getCampChallengeSuccessLimit({}), 3);
});

test("账号配置支持5次成功挑战上限", () => {
  assert.equal(getCampChallengeSuccessLimit({ campChallengeSuccessLimit: 5 }), 5);
});

test("其他配置值回退到3次", () => {
  assert.equal(getCampChallengeSuccessLimit({ campChallengeSuccessLimit: 4 }), 3);
});

test("读取今日成功挑战次数aSuccessCnt", () => {
  assert.equal(getCampChallengeSuccessCount({ aSuccessCnt: 2 }), 2);
  assert.equal(getCampChallengeSuccessCount({}), 0);
});

test("仅发起挑战请求处理13000090", () => {
  const error = { code: 13000090 };
  assert.equal(isCampChallengeDailyLimitError(error, "challenge"), true);
  assert.equal(isCampChallengeDailyLimitError(error, "getInfo"), false);
  assert.equal(isCampChallengeDailyLimitError(error, "claimReward"), false);
});
