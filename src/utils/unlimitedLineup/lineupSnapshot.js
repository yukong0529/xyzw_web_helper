import {
  getEquipmentFingerprint,
  getMapLikeValue,
  iterateMapLike,
} from "./equipmentFingerprint.js";

export const normalizeCommandRole = (roleInfo) => roleInfo?.role || roleInfo || {};

export const normalizePresetTeamInfo = (presetTeamResult) => {
  const root = presetTeamResult?.presetTeamInfo || presetTeamResult || {};
  const presetTeamInfo = root.presetTeamInfo || root;
  return {
    useTeamId: root.useTeamId ?? presetTeamInfo.useTeamId ?? 1,
    presetTeamInfo,
  };
};

export const getTeamData = (presetTeamResult, teamId) => {
  const { presetTeamInfo } = normalizePresetTeamInfo(presetTeamResult);
  return presetTeamInfo?.[teamId] || presetTeamInfo?.[String(teamId)] || {};
};

export const extractBattleTeam = (teamInfo) => {
  const battleTeam = {};
  for (const [position, hero] of Object.entries(teamInfo || {})) {
    const heroId = Number(hero?.heroId ?? hero?.id);
    if (heroId) battleTeam[Number(position)] = heroId;
  }
  return battleTeam;
};

export const extractArtifactAssignments = (artifactBooks) => {
  const artifactToFishId = {};
  iterateMapLike(artifactBooks, (book, fishId) => {
    if (book?.artifactId && book.artifactId !== -1) {
      artifactToFishId[book.artifactId] = Number(fishId);
    }
  });
  return artifactToFishId;
};

export const extractPlainObject = (source) => {
  const result = {};
  iterateMapLike(source, (value, key) => {
    result[key] = value;
  });
  return result;
};

export const createLineupSnapshot = ({
  id,
  name,
  teamId,
  role,
  presetTeam,
  savedAt = Date.now(),
}) => {
  const normalizedRole = normalizeCommandRole(role);
  const teamData = getTeamData(presetTeam, teamId);
  const teamInfo = teamData.teamInfo || {};
  const battleTeam = extractBattleTeam(teamInfo);
  const artifactToFishId = extractArtifactAssignments(
    normalizedRole.artifactBooks,
  );

  const heroes = Object.entries(battleTeam)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([position, heroId]) => {
      const hero = getMapLikeValue(normalizedRole.heroes, heroId) || {};
      const teamHeroInfo = teamInfo[position] || {};
      const artifactId = teamHeroInfo.artifactId || hero.artifactId || null;
      const pearlId = teamHeroInfo.pearlId || hero.pearlId || null;
      const pearlData = pearlId
        ? getMapLikeValue(normalizedRole.pearlMap, pearlId)
        : null;
      return {
        heroId: Number(heroId),
        position: Number(position),
        level: hero.level || teamHeroInfo.level || null,
        order: hero.order || 0,
        artifactId,
        fishId: artifactId ? artifactToFishId[artifactId] || null : null,
        pearlId,
        skillId: pearlData?.skillId || null,
        slotMap: pearlData?.slotMap || null,
        attachmentUid: hero.attachmentUid || teamHeroInfo.attachmentUid || null,
        equipment: hero.equipment || null,
        equipmentFp: getEquipmentFingerprint(hero.equipment),
        equipmentFpStable: getEquipmentFingerprint(hero.equipment, "stable"),
        power: hero.power || null,
        attack: hero.attack || null,
        hp: hero.hp || null,
        speed: hero.speed || null,
      };
    });

  return {
    schemaVersion: 2,
    id,
    name,
    teamId,
    savedAt,
    battleTeam,
    heroes,
    legionResearch: extractPlainObject(normalizedRole.legionResearch),
    weaponId: teamData?.weapon?.weaponId ?? null,
  };
};

export const normalizeImportedLineups = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.lineups)) return payload.lineups;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};
