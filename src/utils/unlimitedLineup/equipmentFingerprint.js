const EQUIPMENT_SLOTS = [1, 2, 3, 4];

const toNum = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getByKey = (source, key) => {
  if (!source) return undefined;
  if (typeof source.get === "function") {
    return source.get(key) ?? source.get(String(key));
  }
  return source[key] ?? source[String(key)];
};

const isBlankPiece = (piece) => {
  if (!piece || typeof piece !== "object") return true;
  const equipId = toNum(piece.equipId);
  const equipConfId = toNum(piece.equipConfId);
  const level = toNum(piece.level, 1);
  const forge = toNum(piece.forge);
  const star = toNum(piece.star);
  const curQ = toNum(
    piece.curQuenchId ?? piece.equipCurQuench ?? piece.quenchId,
  );
  const quenchTimes = toNum(piece.quenchTimes);
  const quenchTimes2 = toNum(piece.quenchTimes2);
  const qLogId = String(piece.quenchLogId || "");
  const qLogId2 = String(piece.quenchLogId2 || "");

  return (
    equipId <= 0 &&
    equipConfId <= 0 &&
    level <= 1 &&
    forge <= 0 &&
    star <= 0 &&
    curQ <= 0 &&
    quenchTimes <= 0 &&
    quenchTimes2 <= 0 &&
    !qLogId &&
    !qLogId2 &&
    !piece.quenches &&
    !piece.quenches2
  );
};

const serializeQuenches = (lines) => {
  if (!lines || typeof lines !== "object") return "";
  return Object.entries(lines)
    .sort((a, b) => toNum(a[0]) - toNum(b[0]))
    .map(([idx, line]) => {
      const colorId = toNum(line?.colorId);
      const attrId = toNum(line?.attrId);
      const attrNum = toNum(line?.attrNum);
      const isLocked = line?.isLocked ? 1 : 0;
      return `${idx}:${colorId}:${attrId}:${attrNum}:${isLocked}`;
    })
    .join(",");
};

export const getEquipmentFingerprint = (equipment, mode) => {
  if (!equipment) return "__none__";
  const isStable = mode === "stable";
  const parts = [];
  let hasReal = false;

  for (const slot of EQUIPMENT_SLOTS) {
    const piece = getByKey(equipment, slot);
    if (isBlankPiece(piece)) {
      parts.push(`${slot}:blank`);
      continue;
    }

    hasReal = true;
    const equipId = toNum(piece.equipId);
    if (equipId > 0) {
      parts.push(`${slot}:eid:${equipId}`);
      continue;
    }

    const qLogId = String(piece.quenchLogId || "");
    const qLogId2 = String(piece.quenchLogId2 || "");
    if (qLogId || qLogId2) {
      parts.push(`${slot}:log:${qLogId || "-"}:${qLogId2 || "-"}`);
      continue;
    }

    const level = toNum(piece.level);
    const forge = toNum(piece.forge);
    const forgeExp = toNum(piece.forgeExp);
    const star = toNum(piece.star);
    const seed = toNum(piece.seed);
    const equipConfId = toNum(piece.equipConfId) || equipId;

    if (isStable) {
      parts.push(
        [
          slot,
          "sb",
          level,
          forge,
          forgeExp,
          star,
          seed,
          equipConfId,
        ].join(":"),
      );
      continue;
    }

    parts.push(
      [
        slot,
        "fb",
        level,
        toNum(piece.attack),
        toNum(piece.defense),
        toNum(piece.hp),
        forge,
        forgeExp,
        star,
        seed,
        toNum(piece.quenchTimes),
        toNum(piece.quenchTimes2),
        toNum(piece.curQuenchId ?? piece.equipCurQuench ?? piece.quenchId),
        toNum(piece.quenchAttackExt),
        toNum(piece.quenchDefenseExt),
        toNum(piece.quenchHpExt),
        serializeQuenches(piece.quenches) || "-",
        serializeQuenches(piece.quenches2) || "-",
      ].join(":"),
    );
  }

  return hasReal ? parts.join("|") : "__none__";
};

export const iterateMapLike = (source, visitor) => {
  if (!source) return;
  if (typeof source.forEach === "function") {
    source.forEach((value, key) => visitor(value, key));
    return;
  }
  if (typeof source.entries === "function") {
    for (const [key, value] of source.entries()) {
      visitor(value, key);
    }
    return;
  }
  for (const [key, value] of Object.entries(source)) {
    visitor(value, key);
  }
};

export const getMapLikeValue = getByKey;

export const findHeroByEquipmentFingerprint = (fp, heroes, mode) => {
  if (!fp || fp === "__none__") return null;
  let found = null;
  iterateMapLike(heroes, (hero, heroId) => {
    if (found || !hero) return;
    if (getEquipmentFingerprint(hero.equipment, mode) === fp) {
      found = Number(heroId);
    }
  });
  return found;
};

const compareFingerprintToken = (left, right, rel, abs) => {
  if (left === right) return true;
  const leftNum = Number(left);
  const rightNum = Number(right);
  if (!Number.isFinite(leftNum) || !Number.isFinite(rightNum)) return false;
  return (
    Math.abs(leftNum - rightNum) <= abs ||
    Math.abs(leftNum - rightNum) <= Math.max(Math.abs(leftNum), 1) * rel
  );
};

export const fuzzyFingerprintMatch = (fpA, fpB, rel = 0.05, abs = 50) => {
  if (!fpA || !fpB) return false;
  if (fpA === fpB) return true;

  const segmentsA = String(fpA).split("|");
  const segmentsB = String(fpB).split("|");
  if (segmentsA.length !== segmentsB.length) return false;

  for (let i = 0; i < segmentsA.length; i++) {
    const tokensA = segmentsA[i].split(":");
    const tokensB = segmentsB[i].split(":");
    if (tokensA.length !== tokensB.length) return false;
    for (let j = 0; j < tokensA.length; j++) {
      if (!compareFingerprintToken(tokensA[j], tokensB[j], rel, abs)) {
        return false;
      }
    }
  }

  return true;
};
