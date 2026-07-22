import {
  findHeroByEquipmentFingerprint,
  fuzzyFingerprintMatch,
  getEquipmentFingerprint,
  getMapLikeValue,
  iterateMapLike,
} from "./equipmentFingerprint.js";
import {
  extractArtifactAssignments,
  getTeamData,
  normalizeCommandRole,
} from "./lineupSnapshot.js";

const COMMAND_DELAY = 120;
const UPGRADE_OPTIONS = [50, 10, 5, 1];
const LEVEL_ORDER_THRESHOLDS = [
  { level: 100, order: 1 },
  { level: 200, order: 2 },
  { level: 300, order: 3 },
  { level: 500, order: 4 },
  { level: 700, order: 5 },
  { level: 900, order: 6 },
  { level: 1100, order: 7 },
  { level: 1300, order: 8 },
  { level: 1500, order: 9 },
  { level: 1800, order: 10 },
  { level: 2100, order: 11 },
  { level: 2400, order: 12 },
  { level: 2800, order: 13 },
  { level: 3200, order: 14 },
  { level: 3600, order: 15 },
  { level: 4000, order: 16 },
  { level: 4500, order: 17 },
  { level: 5000, order: 18 },
  { level: 5500, order: 19 },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrder = (level) => {
  let order = 0;
  for (const threshold of LEVEL_ORDER_THRESHOLDS) {
    if (level >= threshold.level) order = threshold.order;
    else break;
  }
  return order;
};

const getNextOrderLevel = (level) => {
  const threshold = LEVEL_ORDER_THRESHOLDS.find((item) => level < item.level);
  return threshold?.level || null;
};

const getTeamHeroes = (teamInfo) =>
  Object.entries(teamInfo || {})
    .map(([position, hero]) => ({
      position: Number(hero?.battleTeamSlot ?? position),
      heroId: Number(hero?.heroId ?? hero?.id),
      artifactId: hero?.artifactId || null,
      attachmentUid: hero?.attachmentUid || null,
    }))
    .filter((hero) => hero.heroId)
    .sort((a, b) => a.position - b.position);

const getBattleSlotMap = (role) => {
  const map = {};
  iterateMapLike(role?.battleTeam, (hero, slot) => {
    const heroId = Number(hero?.heroId ?? hero?.id ?? hero);
    if (heroId) map[Number(slot)] = heroId;
  });
  return map;
};

const isCultivatedHero = (hero) => {
  if (!hero) return false;
  if ((hero.level || 1) > 1) return true;
  if ((hero.order || 0) > 0) return true;
  return getEquipmentFingerprint(hero.equipment) !== "__none__";
};

const resolveAttachmentHolder = (heroes, attachmentUid) => {
  if (!attachmentUid || attachmentUid === -1) return null;
  let found = null;
  iterateMapLike(heroes, (hero, heroId) => {
    if (!found && hero?.attachmentUid === attachmentUid) {
      found = Number(heroId);
    }
  });
  return found;
};

const resolveCarrier = ({
  targetHero,
  heroes,
  currentBattleSlotMap,
  savedHeroToSlot,
  usedCurrentIds,
}) => {
  const savedHeroId = Number(targetHero.heroId);
  const selfHero = getMapLikeValue(heroes, savedHeroId);

  if (targetHero.equipmentFp && targetHero.equipmentFp !== "__none__") {
    if (
      selfHero &&
      !usedCurrentIds.has(savedHeroId) &&
      getEquipmentFingerprint(selfHero.equipment) === targetHero.equipmentFp
    ) {
      return { heroId: savedHeroId, via: "equipFp(self)" };
    }
    const found = findHeroByEquipmentFingerprint(
      targetHero.equipmentFp,
      heroes,
    );
    if (found && !usedCurrentIds.has(Number(found))) {
      return { heroId: Number(found), via: "equipFp" };
    }
  }

  const stableFp =
    targetHero.equipmentFpStable ||
    (targetHero.equipment
      ? getEquipmentFingerprint(targetHero.equipment, "stable")
      : null);
  if (stableFp && stableFp !== "__none__") {
    if (
      selfHero &&
      !usedCurrentIds.has(savedHeroId) &&
      getEquipmentFingerprint(selfHero.equipment, "stable") === stableFp
    ) {
      return { heroId: savedHeroId, via: "equipFpStable(self)" };
    }
    const found = findHeroByEquipmentFingerprint(stableFp, heroes, "stable");
    if (found && !usedCurrentIds.has(Number(found))) {
      return { heroId: Number(found), via: "equipFpStable" };
    }
  }

  const byAttachment = resolveAttachmentHolder(heroes, targetHero.attachmentUid);
  if (byAttachment && !usedCurrentIds.has(byAttachment)) {
    return { heroId: byAttachment, via: "attachmentUid" };
  }

  const savedSlot = savedHeroToSlot[savedHeroId];
  const bySlot = currentBattleSlotMap[savedSlot];
  if (bySlot && !usedCurrentIds.has(bySlot)) {
    const candidate = getMapLikeValue(heroes, bySlot);
    if (isCultivatedHero(candidate)) return { heroId: bySlot, via: "battleSlot" };
  }

  if (
    selfHero &&
    !usedCurrentIds.has(savedHeroId) &&
    isCultivatedHero(selfHero)
  ) {
    return { heroId: savedHeroId, via: "pool(self)" };
  }

  let fallback = null;
  iterateMapLike(heroes, (hero, heroId) => {
    const numericId = Number(heroId);
    if (fallback || usedCurrentIds.has(numericId) || !isCultivatedHero(hero)) {
      return;
    }
    if (
      stableFp &&
      getEquipmentFingerprint(hero.equipment, "stable") === stableFp
    ) {
      fallback = { heroId: numericId, via: "pool(stable)" };
    }
  });
  if (fallback) return fallback;

  iterateMapLike(heroes, (hero, heroId) => {
    const numericId = Number(heroId);
    if (!fallback && !usedCurrentIds.has(numericId) && isCultivatedHero(hero)) {
      fallback = { heroId: numericId, via: "pool" };
    }
  });
  return fallback;
};

const dedupeSymmetricTasks = (tasks) => {
  const priority = {
    "equipFp(self)": 100,
    equipFp: 95,
    "equipFpStable(self)": 80,
    equipFpStable: 75,
    attachmentUid: 70,
    battleSlot: 50,
    "pool(self)": 30,
    "pool(stable)": 20,
    pool: 10,
  };
  const byPair = new Map();
  for (const task of tasks) {
    const key = [Math.min(task.saved, task.current), Math.max(task.saved, task.current)].join("_");
    const existing = byPair.get(key);
    if (!existing || (priority[task.via] || 0) > (priority[existing.via] || 0)) {
      byPair.set(key, task);
    }
  }
  return [...byPair.values()];
};

const buildExchangeTasks = (snapshot, role, warnings, failedExchangeHeroIds) => {
  const tasks = [];
  const usedCurrentIds = new Set();
  const currentBattleSlotMap = getBattleSlotMap(role);
  const savedHeroToSlot = {};
  for (const [slot, heroId] of Object.entries(snapshot.battleTeam || {})) {
    savedHeroToSlot[Number(heroId)] = Number(slot);
  }

  for (const targetHero of snapshot.heroes || []) {
    if (!targetHero.equipmentFp && !targetHero.equipmentFpStable) {
      warnings.push("旧阵容缺少装备指纹，建议重新保存后再使用无损换将。");
      continue;
    }
    const resolved = resolveCarrier({
      targetHero,
      heroes: role.heroes,
      currentBattleSlotMap,
      savedHeroToSlot,
      usedCurrentIds,
    });
    if (!resolved?.heroId) {
      failedExchangeHeroIds.add(Number(targetHero.heroId));
      continue;
    }
    usedCurrentIds.add(Number(resolved.heroId));
    if (Number(resolved.heroId) !== Number(targetHero.heroId)) {
      tasks.push({
        saved: Number(targetHero.heroId),
        current: Number(resolved.heroId),
        via: resolved.via,
      });
    }
  }

  return dedupeSymmetricTasks(tasks);
};

const shouldPostVerifyPass = (hero, targetHero) => {
  if (!targetHero.equipmentFp || targetHero.equipmentFp === "__none__") {
    return true;
  }
  const full = getEquipmentFingerprint(hero?.equipment);
  const stable = getEquipmentFingerprint(hero?.equipment, "stable");
  return (
    full === targetHero.equipmentFp ||
    stable === targetHero.equipmentFpStable ||
    fuzzyFingerprintMatch(full, targetHero.equipmentFp)
  );
};

const syncLevels = async ({ snapshot, role, send, failedExchangeHeroIds, counts }) => {
  for (const targetHero of snapshot.heroes || []) {
    if (failedExchangeHeroIds.has(Number(targetHero.heroId))) continue;
    if (!targetHero.level || targetHero.level <= 0) continue;
    const current = getMapLikeValue(role.heroes, targetHero.heroId);
    let currentLevel = current?.level || 1;
    let currentOrder = current?.order || 0;
    if (currentLevel !== targetHero.level) {
      if (currentLevel > targetHero.level) {
        await send("hero_rebirth", { heroId: targetHero.heroId });
        currentLevel = 1;
        currentOrder = 0;
      }
      while (currentOrder < getOrder(currentLevel)) {
        await send("hero_heroupgradeorder", { heroId: targetHero.heroId });
        currentOrder++;
      }
      while (currentLevel < targetHero.level) {
        const nextOrderLevel = getNextOrderLevel(currentLevel);
        const cap = nextOrderLevel
          ? Math.min(nextOrderLevel - currentLevel, targetHero.level - currentLevel)
          : targetHero.level - currentLevel;
        const upgradeNum = UPGRADE_OPTIONS.find((num) => num <= cap) || 1;
        await send("hero_heroupgradelevel", {
          heroId: targetHero.heroId,
          upgradeNum,
        });
        currentLevel += upgradeNum;
        if (nextOrderLevel && currentLevel >= nextOrderLevel) {
          await send("hero_heroupgradeorder", { heroId: targetHero.heroId });
          currentOrder++;
        }
      }
      counts.levels++;
    }
  }
};

const syncPositions = async ({ snapshot, teamInfo, send, counts }) => {
  const currentHeroes = getTeamHeroes(teamInfo);
  const targetIds = new Set((snapshot.heroes || []).map((hero) => Number(hero.heroId)));

  for (const hero of currentHeroes) {
    if (!targetIds.has(hero.heroId)) {
      await send("hero_gobackbattle", { slot: hero.position });
      counts.positions++;
    }
  }

  const latestByHero = new Map(currentHeroes.map((hero) => [hero.heroId, hero]));
  for (const targetHero of snapshot.heroes || []) {
    const currentHero = latestByHero.get(Number(targetHero.heroId));
    if (!currentHero) {
      await send("hero_gointobattle", {
        heroId: targetHero.heroId,
        slot: targetHero.position,
      });
      counts.positions++;
    } else if (Number(currentHero.position) !== Number(targetHero.position)) {
      await send("hero_gobackbattle", { slot: currentHero.position });
      await send("hero_gointobattle", {
        heroId: targetHero.heroId,
        slot: targetHero.position,
      });
      counts.positions++;
    }
  }
};

const syncArtifacts = async ({
  snapshot,
  role,
  send,
  failedExchangeHeroIds,
  counts,
}) => {
  const fishToArtifact = {};
  const artifactAssignments = extractArtifactAssignments(role.artifactBooks);
  for (const [artifactId, fishId] of Object.entries(artifactAssignments)) {
    fishToArtifact[Number(fishId)] = Number(artifactId);
  }

  const artifactToHero = {};
  iterateMapLike(role.heroes, (hero, heroId) => {
    if (hero?.artifactId && hero.artifactId !== -1) {
      artifactToHero[hero.artifactId] = Number(heroId);
    }
  });

  for (const targetHero of snapshot.heroes || []) {
    if (failedExchangeHeroIds.has(Number(targetHero.heroId))) continue;
    if (!targetHero.fishId && !targetHero.artifactId && !targetHero.pearlId) continue;
    const artifactId =
      (targetHero.fishId && fishToArtifact[targetHero.fishId]) ||
      targetHero.artifactId ||
      getMapLikeValue(role.pearlMap, targetHero.pearlId)?.artifactId;
    if (!artifactId) continue;
    const currentHolder = artifactToHero[artifactId];
    if (currentHolder && currentHolder !== Number(targetHero.heroId)) {
      await send("artifact_unload", { heroId: currentHolder });
    }
    await send("artifact_load", {
      heroId: targetHero.heroId,
      itemId: artifactId,
      pearlId: targetHero.pearlId || 0,
    });
    counts.artifacts++;
  }
};

const syncPearlSkills = async ({
  snapshot,
  role,
  send,
  failedExchangeHeroIds,
  counts,
}) => {
  for (const targetHero of snapshot.heroes || []) {
    if (failedExchangeHeroIds.has(Number(targetHero.heroId))) continue;
    if (!targetHero.pearlId) continue;
    const currentPearl = getMapLikeValue(role.pearlMap, targetHero.pearlId);
    const currentSkillId = currentPearl?.skillId || null;
    if (!targetHero.skillId) {
      if (currentSkillId) {
        await send("pearl_unloadskill", { pearlId: targetHero.pearlId });
        counts.pearlSkills++;
      }
      continue;
    }
    if (currentSkillId === targetHero.skillId) continue;
    let holderPearlId = null;
    iterateMapLike(role.pearlMap, (pearl, pearlId) => {
      if (
        !holderPearlId &&
        Number(pearlId) !== Number(targetHero.pearlId) &&
        pearl?.skillId === targetHero.skillId
      ) {
        holderPearlId = Number(pearlId);
      }
    });
    if (holderPearlId) {
      await send("pearl_exchangeskill", {
        pearlId1: targetHero.pearlId,
        pearlId2: holderPearlId,
      });
    } else {
      await send("pearl_replaceskill", {
        pearlId: targetHero.pearlId,
        skillId: targetHero.skillId,
      });
    }
    counts.pearlSkills++;
  }
};

export const applyLineupSnapshot = async (snapshot, context) => {
  const warnings = [];
  const failedExchangeHeroIds = new Set();
  const counts = {
    exchanges: 0,
    positions: 0,
    levels: 0,
    artifacts: 0,
    pearlSkills: 0,
    legionResearch: 0,
    weapon: 0,
  };
  const send = async (cmd, params, timeout) => {
    const result = await context.sendCommand(cmd, params, timeout);
    await delay(context.commandDelay ?? COMMAND_DELAY);
    return result;
  };

  if (snapshot.teamId && context.currentTeamId && snapshot.teamId !== context.currentTeamId) {
    context.onProgress?.(`切换到阵容槽位 ${snapshot.teamId}`, "info");
    await send("presetteam_saveteam", { teamId: snapshot.teamId });
  }

  let latest = await context.fetchLatestData(snapshot.teamId);
  let role = normalizeCommandRole(latest.role);
  let teamData = getTeamData(latest.presetTeam, snapshot.teamId || context.currentTeamId);

  context.onProgress?.("处理英雄交换", "info");
  const exchangeTasks = buildExchangeTasks(
    snapshot,
    role,
    warnings,
    failedExchangeHeroIds,
  );
  for (const task of exchangeTasks) {
    await send("hero_exchange", {
      heroId: task.current,
      targetHeroId: task.saved,
    });
    counts.exchanges++;
  }

  latest = await context.fetchLatestData(snapshot.teamId);
  role = normalizeCommandRole(latest.role);
  for (const targetHero of snapshot.heroes || []) {
    if (failedExchangeHeroIds.has(Number(targetHero.heroId))) continue;
    if (!targetHero.equipmentFp) continue;
    const currentHero = getMapLikeValue(role.heroes, targetHero.heroId);
    if (!shouldPostVerifyPass(currentHero, targetHero)) {
      failedExchangeHeroIds.add(Number(targetHero.heroId));
    }
  }
  if (failedExchangeHeroIds.size > 0) {
    warnings.push(
      `${failedExchangeHeroIds.size} 个英雄装备指纹不匹配，已跳过等级/鱼灵/鱼珠同步。`,
    );
  }

  context.onProgress?.("调整战斗站位", "info");
  teamData = getTeamData(latest.presetTeam, snapshot.teamId || context.currentTeamId);
  await syncPositions({
    snapshot,
    teamInfo: teamData.teamInfo || {},
    send,
    counts,
  });

  context.onProgress?.("同步英雄等级", "info");
  await syncLevels({ snapshot, role, send, failedExchangeHeroIds, counts });

  context.onProgress?.("同步鱼灵", "info");
  await syncArtifacts({ snapshot, role, send, failedExchangeHeroIds, counts });

  context.onProgress?.("同步鱼珠技能", "info");
  await syncPearlSkills({ snapshot, role, send, failedExchangeHeroIds, counts });

  if (
    snapshot.legionResearch &&
    Object.keys(snapshot.legionResearch).length > 0 &&
    typeof context.syncLegionResearch === "function"
  ) {
    context.onProgress?.("同步俱乐部科技", "info");
    const result = await context.syncLegionResearch(snapshot.legionResearch);
    if (result?.success) {
      counts.legionResearch++;
    } else if (result?.message) {
      warnings.push(result.message);
    }
  }

  if (snapshot.weaponId !== undefined && snapshot.weaponId !== null) {
    const currentWeaponId = teamData?.weapon?.weaponId ?? null;
    if (currentWeaponId !== snapshot.weaponId) {
      await send("lordweapon_changedefaultweapon", { weaponId: snapshot.weaponId });
      counts.weapon++;
    }
  }

  return {
    success: true,
    warnings: [...new Set(warnings)],
    failedExchangeHeroIds,
    appliedCounts: counts,
  };
};
