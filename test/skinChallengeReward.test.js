import assert from "node:assert/strict";
import {
  getSkinChallengeRewardPlan,
  getSkinChallengeRewardQuantity,
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
  getSkinChallengeRewardQuantity({
    data: { role: { items: { 5274: { quantity: 6 } } } },
  }),
  6,
  "uses the stage claim response as the authoritative remaining quantity",
);

assert.equal(
  getSkinChallengeRewardQuantity({ data: { role: { items: {} } } }),
  0,
  "treats an absent item 5274 in the stage claim response as zero remaining",
);

console.log("skin challenge reward tests passed");
