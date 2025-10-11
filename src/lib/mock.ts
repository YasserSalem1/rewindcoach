import type {
  CoachQuestionPayload,
  MatchBundle,
  ProfileResponse,
  Region,
  RiotMatch,
  TimelineEvent,
  TimelineFrame,
} from "./riot";

const GAME_VERSION = "14.24.1";

const profileIcon = (id: number) =>
  `/images/Logo.png`;

const championIcon = (champion: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${GAME_VERSION}/img/champion/${champion}.png`;

const itemIcon = (id: number) =>
  `https://ddragon.leagueoflegends.com/cdn/${GAME_VERSION}/img/item/${id}.png`;

const runeIcon = (path: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/perk-images/${path}`;

const spellIcon = (spell: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${GAME_VERSION}/img/spell/${spell}.png`;

const primaryPuuid = "mock-puuid-yasser";

const baseProfile: ProfileResponse = {
  profile: {
    summonerName: "Yasser",
    tagline: "EUW",
    level: 347,
    profileIcon: profileIcon(5269),
    rankedTier: "MASTER",
    rankedDivision: "I",
    rankedLp: 112,
  },
  styleDNA: {
    title: "Style DNA",
    description:
      "Calculated aggression defines your play. You contest waves early, accelerate tempo with roams, and rarely give up space around major objectives.",
    tags: [
      "Aggressive Laner",
      "Objective Focused",
      "Macro Shotcaller",
      "Tempo Breaker",
      "Vision Architect",
    ],
    radar: [
      { axis: "Aggression", score: 82 },
      { axis: "Objective Control", score: 91 },
      { axis: "Vision", score: 74 },
      { axis: "Macro", score: 88 },
      { axis: "Consistency", score: 68 },
    ],
  },
  highlights: {
    last20WinRate: 0.65,
    averageKda: 4.21,
    csPerMinute: 6.7,
    topChampions: [
      {
        championId: "Irelia",
        championName: "Irelia",
        icon: championIcon("Irelia"),
        games: 8,
        winRate: 0.75,
        averageKda: 4.8,
      },
      {
        championId: "Yone",
        championName: "Yone",
        icon: championIcon("Yone"),
        games: 6,
        winRate: 0.66,
        averageKda: 3.9,
      },
      {
        championId: "Akali",
        championName: "Akali",
        icon: championIcon("Akali"),
        games: 4,
        winRate: 0.5,
        averageKda: 3.3,
      },
    ],
  },
  puuid: primaryPuuid,
};

const runeShardIcons = [
  runeIcon("StatMods/StatModsAttackSpeedIcon.png"),
  runeIcon("StatMods/StatModsAdaptiveForceIcon.png"),
  runeIcon("StatMods/StatModsHealthPlusIcon.png"),
];

const matches: RiotMatch[] = [
  {
    id: "EUW1_7023456789",
    region: "EUW",
    queueId: 420,
    queueType: "Ranked Solo",
    gameVersion: "14.24",
    gameCreation: new Date().toISOString(),
    gameDuration: 1985,
    primaryParticipantPuuid: primaryPuuid,
    teams: [
      {
        teamId: 100,
        name: "Blue Team",
        win: true,
        kills: 32,
        dragons: 3,
        barons: 1,
        heralds: 1,
        towers: 9,
      },
      {
        teamId: 200,
        name: "Red Team",
        win: false,
        kills: 24,
        dragons: 1,
        barons: 0,
        heralds: 0,
        towers: 3,
      },
    ],
    participants: [
      {
        puuid: primaryPuuid,
        summonerName: "Yasser",
        championId: "Irelia",
        championName: "Irelia",
        championIcon: championIcon("Irelia"),
        kills: 14,
        deaths: 4,
        assists: 6,
        cs: 212,
        goldEarned: 15640,
        role: "Fighter",
        lane: "TOP",
        teamId: 100,
        win: true,
        items: [
          { id: 6630, name: "Goredrinker", icon: itemIcon(6630) },
          { id: 3074, name: "Ravenous Hydra", icon: itemIcon(3074) },
          { id: 3026, name: "Guardian Angel", icon: itemIcon(3026) },
          { id: 3111, name: "Mercury's Treads", icon: itemIcon(3111) },
          { id: 6333, name: "Death's Dance", icon: itemIcon(6333) },
        ],
        trinket: { id: 3361, name: "Farsight Alteration", icon: itemIcon(3361) },
        runes: {
          primary: runeIcon("Styles/Precision/Conqueror/Conqueror.png"),
          secondary: runeIcon("Styles/Resolve/SecondWind/SecondWind.png"),
          shards: runeShardIcons,
        },
        spells: [
          spellIcon("SummonerFlash"),
          spellIcon("SummonerTeleport"),
        ],
      },
      {
        puuid: "ally-2",
        summonerName: "JungleBuddy",
        championId: "LeeSin",
        championName: "Lee Sin",
        championIcon: championIcon("LeeSin"),
        kills: 4,
        deaths: 5,
        assists: 12,
        cs: 178,
        goldEarned: 11409,
        role: "Assassin",
        lane: "JUNGLE",
        teamId: 100,
        win: true,
        items: [],
        runes: {
          primary: runeIcon("Styles/Domination/Electrocute/Electrocute.png"),
          secondary: runeIcon("Styles/Resolve/SecondWind/SecondWind.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerSmite"), spellIcon("SummonerFlash")],
      },
      {
        puuid: "enemy-1",
        summonerName: "TopBruiser",
        championId: "Renekton",
        championName: "Renekton",
        championIcon: championIcon("Renekton"),
        kills: 5,
        deaths: 9,
        assists: 4,
        cs: 198,
        goldEarned: 12010,
        role: "Fighter",
        lane: "TOP",
        teamId: 200,
        win: false,
        items: [],
        runes: {
          primary: runeIcon("Styles/Precision/PressTheAttack/PressTheAttack.png"),
          secondary: runeIcon("Styles/Resolve/BonePlating/BonePlating.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerFlash"), spellIcon("SummonerTeleport")],
      },
    ],
  },
  {
    id: "EUW1_7023456790",
    region: "EUW",
    queueId: 420,
    queueType: "Ranked Solo",
    gameVersion: "14.24",
    gameCreation: new Date(Date.now() - 86400000).toISOString(),
    gameDuration: 1820,
    primaryParticipantPuuid: primaryPuuid,
    teams: [
      {
        teamId: 100,
        name: "Blue Team",
        win: false,
        kills: 18,
        dragons: 1,
        barons: 0,
        heralds: 1,
        towers: 3,
      },
      {
        teamId: 200,
        name: "Red Team",
        win: true,
        kills: 27,
        dragons: 3,
        barons: 1,
        heralds: 0,
        towers: 9,
      },
    ],
    participants: [
      {
        puuid: primaryPuuid,
        summonerName: "Yasser",
        championId: "Yone",
        championName: "Yone",
        championIcon: championIcon("Yone"),
        kills: 7,
        deaths: 8,
        assists: 4,
        cs: 195,
        goldEarned: 12802,
        role: "Assassin",
        lane: "MIDDLE",
        teamId: 100,
        win: false,
        items: [
          { id: 6673, name: "Immortal Shieldbow", icon: itemIcon(6673) },
          { id: 3124, name: "Guinsoo's Rageblade", icon: itemIcon(3124) },
          { id: 3031, name: "Infinity Edge", icon: itemIcon(3031) },
        ],
        trinket: { id: 3340, name: "Farsight Trinket", icon: itemIcon(3340) },
        runes: {
          primary: runeIcon("Styles/Precision/LethalTempo/LethalTempoTemp.png"),
          secondary: runeIcon("Styles/Resolve/SecondWind/SecondWind.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerFlash"), spellIcon("SummonerTeleport")],
      },
      {
        puuid: "enemy-mid",
        summonerName: "ControlMage",
        championId: "Orianna",
        championName: "Orianna",
        championIcon: championIcon("Orianna"),
        kills: 9,
        deaths: 4,
        assists: 10,
        cs: 210,
        goldEarned: 15230,
        role: "Mage",
        lane: "MIDDLE",
        teamId: 200,
        win: true,
        items: [],
        runes: {
          primary: runeIcon("Styles/Sorcery/Aery/Aery.png"),
          secondary: runeIcon("Styles/Inspiration/MagicalFootwear/MagicalFootwear.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerFlash"), spellIcon("SummonerTeleport")],
      },
    ],
  },
  {
    id: "EUW1_7023456791",
    region: "EUW",
    queueId: 420,
    queueType: "Ranked Solo",
    gameVersion: "14.24",
    gameCreation: new Date(Date.now() - 2 * 86400000).toISOString(),
    gameDuration: 2140,
    primaryParticipantPuuid: primaryPuuid,
    teams: [
      {
        teamId: 100,
        name: "Blue Team",
        win: true,
        kills: 29,
        dragons: 2,
        barons: 2,
        heralds: 0,
        towers: 8,
      },
      {
        teamId: 200,
        name: "Red Team",
        win: false,
        kills: 17,
        dragons: 1,
        barons: 0,
        heralds: 1,
        towers: 4,
      },
    ],
    participants: [
      {
        puuid: primaryPuuid,
        summonerName: "Yasser",
        championId: "Akali",
        championName: "Akali",
        championIcon: championIcon("Akali"),
        kills: 15,
        deaths: 3,
        assists: 9,
        cs: 236,
        goldEarned: 17890,
        role: "Assassin",
        lane: "MIDDLE",
        teamId: 100,
        win: true,
        items: [
          { id: 3145, name: "Hextech Alternator", icon: itemIcon(3145) },
          { id: 4636, name: "Night Harvester", icon: itemIcon(4636) },
          { id: 3157, name: "Zhonya's Hourglass", icon: itemIcon(3157) },
          { id: 3020, name: "Sorcerer's Shoes", icon: itemIcon(3020) },
        ],
        trinket: { id: 3364, name: "Oracle Lens", icon: itemIcon(3364) },
        runes: {
          primary: runeIcon("Styles/Domination/Electrocute/Electrocute.png"),
          secondary: runeIcon("Styles/Precision/PresenceOfMind/PresenceOfMind.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerFlash"), spellIcon("SummonerIgnite")],
      },
      {
        puuid: "enemy-mid",
        summonerName: "ScalingMage",
        championId: "Kassadin",
        championName: "Kassadin",
        championIcon: championIcon("Kassadin"),
        kills: 6,
        deaths: 9,
        assists: 4,
        cs: 224,
        goldEarned: 13220,
        role: "Assassin",
        lane: "MIDDLE",
        teamId: 200,
        win: false,
        items: [],
        runes: {
          primary: runeIcon("Styles/Sorcery/FirstStrike/FirstStrike.png"),
          secondary: runeIcon("Styles/Resolve/SecondWind/SecondWind.png"),
          shards: runeShardIcons,
        },
        spells: [spellIcon("SummonerFlash"), spellIcon("SummonerTeleport")],
      },
    ],
  },
];

const timelineByMatch: Record<string, TimelineFrame[]> = {
  EUW1_7023456789: [
    {
      timestamp: 120,
      events: [
        killEvent("lane pressure kill", {
          id: "kill-1",
          timestamp: 120,
          killerPuuid: primaryPuuid,
          victimPuuid: "enemy-1",
          description: "Solo kill top at level 4",
          position: { x: 5800, y: 13500 },
          teamId: 100,
        }),
      ],
    },
    {
      timestamp: 615,
      events: [
        objectiveEvent("first-herald", {
          id: "herald-1",
          timestamp: 615,
          description: "Team secured Rift Herald",
          position: { x: 9850, y: 4500 },
          teamId: 100,
        }),
      ],
    },
    {
      timestamp: 1010,
      events: [
        killEvent("mid roam double kill", {
          id: "kill-2",
          timestamp: 1010,
          killerPuuid: primaryPuuid,
          victimPuuid: "enemy-3",
          description: "Roamed mid for decisive pick",
          position: { x: 7800, y: 7800 },
          teamId: 100,
        }),
        killEvent("mid roam double kill", {
          id: "kill-3",
          timestamp: 1014,
          killerPuuid: "ally-2",
          victimPuuid: "enemy-2",
          description: "Lee Sin followed up for a second kill",
          position: { x: 7850, y: 7350 },
          teamId: 100,
        }),
      ],
    },
    {
      timestamp: 1340,
      events: [
        objectiveEvent("dragon fight", {
          id: "dragon-1",
          timestamp: 1340,
          description: "Contested third dragon",
          position: { x: 9900, y: 4400 },
          teamId: 100,
        }),
        deathEvent({
          id: "death-1",
          timestamp: 1342,
          killerPuuid: "enemy-2",
          victimPuuid: primaryPuuid,
          description: "Died attempting to zone carries",
          position: { x: 10100, y: 4300 },
          teamId: 200,
        }),
      ],
    },
    {
      timestamp: 1800,
      events: [
        objectiveEvent("baron", {
          id: "baron-1",
          timestamp: 1800,
          description: "Secured Baron to close the game",
          position: { x: 5000, y: 12000 },
          teamId: 100,
        }),
      ],
    },
  ],
  EUW1_7023456790: [
    {
      timestamp: 300,
      events: [
        killEvent("lane trade", {
          id: "kill-4",
          timestamp: 300,
          killerPuuid: "enemy-mid",
          victimPuuid: primaryPuuid,
          description: "Aggressive trade gone wrong mid",
          position: { x: 7800, y: 7800 },
          teamId: 200,
        }),
      ],
    },
    {
      timestamp: 890,
      events: [
        objectiveEvent("herald loss", {
          id: "herald-2",
          timestamp: 890,
          description: "Enemy secured first Herald",
          position: { x: 9850, y: 4500 },
          teamId: 200,
        }),
      ],
    },
    {
      timestamp: 1420,
      events: [
        objectiveEvent("soul point", {
          id: "dragon-2",
          timestamp: 1420,
          description: "Enemy reached soul point",
          position: { x: 9900, y: 4400 },
          teamId: 200,
        }),
      ],
    },
  ],
  EUW1_7023456791: [
    {
      timestamp: 240,
      events: [
        killEvent("level 2 cheese", {
          id: "kill-5",
          timestamp: 240,
          killerPuuid: primaryPuuid,
          victimPuuid: "enemy-mid",
          description: "Level 2 all-in behind minion wave",
          position: { x: 7800, y: 7800 },
          teamId: 100,
        }),
      ],
    },
    {
      timestamp: 960,
      events: [
        objectiveEvent("herald swap", {
          id: "herald-3",
          timestamp: 960,
          description: "Rotated early for Herald and plates",
          position: { x: 5000, y: 10300 },
          teamId: 100,
        }),
      ],
    },
    {
      timestamp: 1680,
      events: [
        killEvent("inhib dive", {
          id: "kill-6",
          timestamp: 1680,
          killerPuuid: primaryPuuid,
          victimPuuid: "enemy-mid",
          description: "Picked Kassadin before Elder setup",
          position: { x: 5200, y: 5200 },
          teamId: 100,
        }),
      ],
    },
  ],
};

function killEvent(
  _label: string,
  event: Omit<TimelineEvent, "type" | "position"> & {
    position: TimelineEvent["position"];
  },
): TimelineEvent {
  return {
    type: "KILL",
    ...event,
  };
}

function deathEvent(
  event: Omit<TimelineEvent, "type" | "position"> & {
    position: TimelineEvent["position"];
  },
): TimelineEvent {
  return {
    type: "DEATH",
    ...event,
  };
}

function objectiveEvent(
  _label: string,
  event: Omit<TimelineEvent, "type" | "position"> & {
    position: TimelineEvent["position"];
  },
): TimelineEvent {
  return {
    type: "OBJECTIVE",
    ...event,
  };
}

export function getMockProfile(region: Region, riotId: string): ProfileResponse {
  const [name, tag] = riotId.split("#");
  return {
    profile: {
      ...baseProfile.profile,
      summonerName: name || baseProfile.profile.summonerName,
      tagline: (tag || region) as string,
    },
    styleDNA: baseProfile.styleDNA,
    highlights: baseProfile.highlights,
    puuid: primaryPuuid,
  };
}

export function getMockMatches(riotId: string): RiotMatch[] {
  void riotId;
  return matches;
}

export function getMockMatchBundle(matchId: string): MatchBundle {
  const match = matches.find((m) => m.id === matchId);
  if (!match) {
    throw new Error(`Mock match ${matchId} not found`);
  }

  return {
    match,
    timeline: timelineByMatch[matchId] ?? [
      {
        timestamp: 0,
        events: [],
      },
    ],
  };
}

export function streamMockCoachResponse(
  payload: CoachQuestionPayload,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sentences = [
    `Reviewing ${payload.question.trim() || "your request"} from match ${
      payload.matchId
    }. `,
    "At 10:12 you pushed the wave without vision of the enemy jungler. ",
    "Set up the river ward before stacking the wave so you can hover towards safety. ",
    "Consider syncing with your jungler's pathing to contest the second spawn of Rift Herald. ",
  ];

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const sentence of sentences) {
        controller.enqueue(encoder.encode(sentence));
        await new Promise((resolve) => setTimeout(resolve, 140));
      }
      controller.close();
    },
  });
}
