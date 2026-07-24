const REWARD_ITEM_ID = 5274;

export const getSkinChallengeRewardPlan = (roleInfo, towerActId) => {
  const role = roleInfo?.role ?? roleInfo ?? {};
  const quantity = Number(role.items?.[REWARD_ITEM_ID]?.quantity) || 0;

  return {
    actId: Number(towerActId) + 1,
    total: Math.max(0, Math.floor(quantity)),
  };
};
