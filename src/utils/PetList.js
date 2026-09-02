// 宠物字典：id → 名称 + 图标 CDN 地址
// 数据来源：fenJS/宠物图标URL.txt
// rank_getroleinfo 的响应里，宠物在两处出现：
//   - showPet   = { petId, level }   顶层字段，含等级，展示用这个
//   - roleInfo.pet = { petId, petUId }  只有 id
export const PET_DICT = {
  101: {
    name: "大眼海胆",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/8a/8a24c233-27af-46a0-a42a-b621262a71af.a4816.png",
  },
  102: {
    name: "芽芽蛙",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/39/39a6574d-9d62-4a5f-8a58-a51ca80736a8.76790.png",
  },
  103: {
    name: "泡泡蝇",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/4e/4eeb24dc-3f52-4c8b-b7eb-10491a93fc4a.4e1df.png",
  },
  104: {
    name: "小幽灵",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/5c/5c4250b9-48f0-4f27-bdbf-77d2b2e055ba.b5bc9.png",
  },
  201: {
    name: "你真蚌",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/7e/7edd4925-4ebd-401b-97b7-fc18d080d160.e8946.png",
  },
  202: {
    name: "梨嘴鸭",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/36/36d45ed3-0b92-4aa7-9359-1784d813635a.17928.png",
  },
  203: {
    name: "响尾蜂",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/8b/8b84109c-2ad4-42a2-a328-9344681b9fb8.d86d0.png",
  },
  204: {
    name: "溜溜萝",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/7d/7d3cd3df-a87c-4695-b306-cc437913c07c.ad230.png",
  },
  301: {
    name: "冰灯水母",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/76/76ac5fba-719e-4e8f-bdac-473dd43b7320.ccc92.png",
  },
  302: {
    name: "热狗",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/69/697ad30e-cfcb-4de1-9de9-175a000a6aa1.63739.png",
  },
  303: {
    name: "幽影蝶",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/01/013dfb50-e05f-498a-a7c0-b3e5c0152fd4.611ef.png",
  },
  304: {
    name: "烛灵",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/66/66d8ee4d-29c2-44d9-bfd8-e3d32f63e9c0.0545a.png",
  },
  401: {
    name: "潮团兽",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/5a/5a299ac9-ba88-4964-95e6-6be6fc98f843.9c892.png",
  },
  402: {
    name: "盘牙",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/b8/b8c6ac1d-a8ff-4e20-b2c5-4229630ceee2.edc44.png",
  },
  403: {
    name: "铁头飞猪",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/75/754711dc-c3cc-4f01-84ee-599b0f1eb7ef.64fe0.png",
  },
  404: {
    name: "长颈树",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/ba/badbf7b5-c024-4e96-a48a-eb9f45052bdc.cb667.png",
  },
  501: {
    name: "武虾",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/06/06316c2f-ad93-40bc-8991-f99eb50294ec.4bc35.png",
  },
  502: {
    name: "拳击狐",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/47/47b51dc0-0b90-4f53-ba19-183500045a8e.26aa3.png",
  },
  503: {
    name: "雷帽绒",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/2c/2cd55a43-9f79-4edd-8b44-07a7e81789bd.0c570.png",
  },
  504: {
    name: "灰烬兔",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/4b/4b6b6683-384a-4800-b268-9be63b9d68ea.85598.png",
  },
  601: {
    name: "甲锅龟",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/3f/3f40115e-adf6-422e-81c8-798667583e51.8bc91.png",
  },
  602: {
    name: "炎鬃狮",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/6c/6ca19753-1ec2-45bf-aeac-e17757e07e2c.d8f56.png",
  },
  603: {
    name: "疾风隼",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/e8/e82f37bc-5af8-4a24-bd79-d94e05d5be8c.b76d5.png",
  },
  604: {
    name: "蛇尾枭",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/1a/1a463057-0149-4130-9cf2-b597fc2e7303.3f9d1.png",
  },
  701: {
    name: "黄金章鱼",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/8b/8bdcd4a5-2bce-4b86-8778-ec5b28052bc6.60d17.png",
  },
  // 以下三条在图标抓取时 success 为 false，地址可能失效，名称仍可用
  702: {
    name: "赤兔马",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/62/628c2759-8526-44bf-8101-e20bfce4d3be.8ecd3.png",
  },
  703: {
    name: "玄翎鹤",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/8e/8ed3f4fb-11c4-4fd2-b7e3-e4be4a4c0fc5.62756.png",
  },
  704: {
    name: "食梦貘",
    icon: "https://xxz-xyzw-res.hortorgames.com/remote/icons/native/4d/4d76857d-3c3e-4485-87a8-6a4bb468c154.66893.png",
  },
};

/**
 * 宠物品质：由 petId 的首位数字决定
 * 1 白 / 2 绿 / 3 蓝 / 4 紫 / 5 橙 / 6 红 / 7 金
 */
export const PET_QUALITY = {
  1: { name: "白", color: "#262626" }, // 白色品质用黑色文字，浅色底才看得清
  2: { name: "绿", color: "#52c41a" },
  3: { name: "蓝", color: "#1890ff" },
  4: { name: "紫", color: "#722ed1" },
  5: { name: "橙", color: "#fa8c16" },
  6: { name: "红", color: "#f5222d" },
  7: { name: "金", color: "#d4a017" },
};

/** 取 petId 的首位数字对应的品质配置 */
export const getPetQuality = (petId) =>
  PET_QUALITY[Math.floor(Number(petId) / 100)] || PET_QUALITY[1];

/**
 * 从 rank_getroleinfo 的响应里取出展示用的宠物信息
 * @param {object} roleRes rank_getroleinfo 的响应对象
 * @returns {{petId:number, level:number, name:string, icon:string, quality:string, color:string}|null}
 */
export const getShowPet = (roleRes) => {
  const petId = roleRes?.showPet?.petId ?? roleRes?.roleInfo?.pet?.petId;
  if (!petId) return null;
  const dict = PET_DICT[petId];
  const quality = getPetQuality(petId);
  return {
    petId,
    level: roleRes?.showPet?.level || 0,
    name: dict?.name || `宠物${petId}`,
    icon: dict?.icon || "",
    quality: quality.name,
    color: quality.color,
  };
};
