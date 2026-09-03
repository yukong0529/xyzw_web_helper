import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  getCampChallengeSuccessLimit,
  getCampChallengeSuccessCount,
  isCampChallengeDailyLimitError,
  isCampChallengeTargetChangedError,
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

test("不输出今日成功挑战进度的重复日志", () => {
  const source = fs.readFileSync(
    new URL("../src/utils/batch/tasksCampChallenge.js", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("message: `${token.name} 今日成功挑战 ${successCountToday}/${successLimit} 次`"), false);
});

test("识别营地挑战目标数据变化错误", () => {
  assert.equal(isCampChallengeTargetChangedError({ code: 13000070 }), true);
  assert.equal(isCampChallengeTargetChangedError({ code: 13000090 }), false);
});

test("目标数据变化时先刷新营地信息再刷新目标阵容", () => {
  const source = fs.readFileSync(
    new URL("../src/utils/batch/tasksCampChallenge.js", import.meta.url),
    "utf8",
  );
  const changedHandler = source.slice(
    source.indexOf("if (isCampChallengeTargetChangedError(err))"),
  );
  assert.match(changedHandler, /挑战目标信息已变化，正在刷新后重试/);
  assert.ok(
    changedHandler.indexOf('"club_getinfo"') <
      changedHandler.indexOf('"club_gettargetteam"'),
  );
  assert.match(changedHandler, /MAX_TARGET_REFRESH_RETRIES/);
});

test("营地限频错误码400340有中文映射", () => {
  const source = fs.readFileSync(
    new URL("../src/utils/xyzwWebSocket.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /400340: "操作过快，请稍后重试"/);
});

test("营地挑战使用命令延迟和任务间延迟", () => {
  const source = fs.readFileSync(
    new URL("../src/utils/batch/tasksCampChallenge.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /delayConfig = \{\}/);
  assert.match(source, /wait\(delayConfig\.command\)/);
  assert.match(source, /wait\(delayConfig\.task\)/);
  assert.match(source, /sendCampCommand\(\s*tokenId,\s*"club_attackmonster"/s);
  assert.match(source, /sendCampCommand\(\s*tokenId,\s*"club_attack"/s);
});
