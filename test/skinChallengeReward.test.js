import assert from "node:assert/strict";
import { getSkinChallengeRewardPlan } from "../src/utils/skinChallengeReward.js";

assert.deepEqual(
  getSkinChallengeRewardPlan(
    { role: { items: { 5274: { quantity: 3 } } } },
    2607241,
  ),
  { actId: 2607242, total: 3 },
  "uses item 5274 quantity as the reward claim total",
);

assert.deepEqual(
  getSkinChallengeRewardPlan({ role: { items: {} } }, 2607241),
  { actId: 2607242, total: 0 },
  "does not schedule claims when item 5274 is absent",
);

console.log("skin challenge reward tests passed");
