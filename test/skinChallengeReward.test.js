import assert from "node:assert/strict";
import {
  getSkinChallengeRewardPlan,
  getSkinChallengeRewardQuantity,
  getSkinChallengeStageNum,
} from "../src/utils/skinChallengeReward.js";

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

assert.equal(
  getSkinChallengeRewardQuantity({ role: { items: { 5274: { quantity: 4 } } } }),
  4,
  "reads item 5274 directly from the command response body",
);

assert.equal(
  getSkinChallengeRewardQuantity({ data: { role: { items: {} } } }),
  0,
  "treats an absent item 5274 in the stage claim response as zero remaining",
);

assert.equal(
  getSkinChallengeStageNum({ actEGame: { stageNum: 5 } }),
  5,
  "reads the stage number directly from the command response body",
);

console.log("skin challenge reward tests passed");
