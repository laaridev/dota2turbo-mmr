/**
 * Hero Role Classification for TMMR Calculation
 * 
 * Maps each hero to their expected KDA based on typical role.
 * This allows us to normalize KDA so supports aren't penalized
 * for having lower KDA than carries.
 * 
 * Data source: OpenDota API /api/heroes
 * 
 * Role Categories:
 * - HARD_CARRY: Expected KDA ~4.0 (AM, Spectre, PA, etc.)
 * - CORE: Expected KDA ~3.5 (Mid heroes, semi-carries)
 * - OFFLANE: Expected KDA ~3.0 (Initiators, frontliners)
 * - SOFT_SUPPORT: Expected KDA ~2.0 (Position 4)
 * - HARD_SUPPORT: Expected KDA ~1.5 (Position 5)
 */

export enum HeroRole {
    HARD_CARRY = 'HARD_CARRY',
    CORE = 'CORE',
    OFFLANE = 'OFFLANE',
    SOFT_SUPPORT = 'SOFT_SUPPORT',
    HARD_SUPPORT = 'HARD_SUPPORT'
}

export const ROLE_EXPECTED_KDA: Record<HeroRole, number> = {
    [HeroRole.HARD_CARRY]: 4.0,
    [HeroRole.CORE]: 3.5,
    [HeroRole.OFFLANE]: 3.0,
    [HeroRole.SOFT_SUPPORT]: 2.0,
    [HeroRole.HARD_SUPPORT]: 1.5
};

/**
 * Hero ID to Role mapping
 * Based on OpenDota API roles[] data and typical pub meta
 * 
 * Classification logic:
 * - First role in API is "Carry" → HARD_CARRY or CORE
 * - First role is "Support" → SOFT_SUPPORT or HARD_SUPPORT
 * - Otherwise based on typical pub position
 */
export const HERO_ROLES: Record<number, HeroRole> = {
    // === HARD CARRIES (Pos 1) ===
    1: HeroRole.HARD_CARRY,    // Anti-Mage
    4: HeroRole.CORE,          // Bloodseeker (jungle/mid viable too)
    6: HeroRole.HARD_CARRY,    // Drow Ranger
    8: HeroRole.HARD_CARRY,    // Juggernaut
    10: HeroRole.HARD_CARRY,   // Morphling
    12: HeroRole.HARD_CARRY,   // Phantom Lancer
    18: HeroRole.HARD_CARRY,   // Sven
    28: HeroRole.OFFLANE,      // Slardar (usually offlane)
    32: HeroRole.CORE,         // Riki (can pos 4 too)
    41: HeroRole.HARD_CARRY,   // Faceless Void
    42: HeroRole.HARD_CARRY,   // Wraith King
    44: HeroRole.HARD_CARRY,   // Phantom Assassin
    46: HeroRole.CORE,         // Templar Assassin (mid)
    48: HeroRole.HARD_CARRY,   // Luna
    54: HeroRole.HARD_CARRY,   // Lifestealer
    56: HeroRole.CORE,         // Clinkz
    59: HeroRole.CORE,         // Huskar
    63: HeroRole.HARD_CARRY,   // Weaver
    67: HeroRole.HARD_CARRY,   // Spectre
    70: HeroRole.HARD_CARRY,   // Ursa
    72: HeroRole.HARD_CARRY,   // Gyrocopter
    77: HeroRole.HARD_CARRY,   // Lycan
    80: HeroRole.HARD_CARRY,   // Lone Druid
    81: HeroRole.HARD_CARRY,   // Chaos Knight
    82: HeroRole.HARD_CARRY,   // Meepo
    89: HeroRole.HARD_CARRY,   // Naga Siren (can support too)
    93: HeroRole.HARD_CARRY,   // Slark
    94: HeroRole.HARD_CARRY,   // Medusa
    95: HeroRole.HARD_CARRY,   // Troll Warlord
    109: HeroRole.HARD_CARRY,  // Terrorblade
    114: HeroRole.HARD_CARRY,  // Monkey King
    145: HeroRole.HARD_CARRY,  // Kez

    // === CORE MID (Pos 2) ===
    11: HeroRole.CORE,         // Shadow Fiend
    13: HeroRole.CORE,         // Puck
    17: HeroRole.CORE,         // Storm Spirit
    19: HeroRole.CORE,         // Tiny
    22: HeroRole.CORE,         // Zeus
    34: HeroRole.CORE,         // Tinker
    35: HeroRole.CORE,         // Sniper
    36: HeroRole.CORE,         // Necrophos
    39: HeroRole.CORE,         // Queen of Pain
    43: HeroRole.CORE,         // Death Prophet
    45: HeroRole.CORE,         // Pugna
    47: HeroRole.CORE,         // Viper
    49: HeroRole.CORE,         // Dragon Knight
    52: HeroRole.CORE,         // Leshrac
    60: HeroRole.CORE,         // Night Stalker
    61: HeroRole.CORE,         // Broodmother
    73: HeroRole.CORE,         // Alchemist
    74: HeroRole.CORE,         // Invoker
    76: HeroRole.CORE,         // Outworld Destroyer
    78: HeroRole.CORE,         // Brewmaster
    98: HeroRole.CORE,         // Timbersaw
    99: HeroRole.CORE,         // Bristleback
    104: HeroRole.CORE,        // Legion Commander
    106: HeroRole.CORE,        // Ember Spirit
    113: HeroRole.CORE,        // Arc Warden
    120: HeroRole.CORE,        // Pangolier
    126: HeroRole.CORE,        // Void Spirit
    135: HeroRole.CORE,        // Dawnbreaker
    138: HeroRole.CORE,        // Muerta

    // === OFFLANE (Pos 3) ===
    2: HeroRole.OFFLANE,       // Axe
    14: HeroRole.OFFLANE,      // Pudge
    15: HeroRole.CORE,         // Razor
    23: HeroRole.OFFLANE,      // Kunkka
    29: HeroRole.OFFLANE,      // Tidehunter
    33: HeroRole.OFFLANE,      // Enigma
    38: HeroRole.OFFLANE,      // Beastmaster
    51: HeroRole.OFFLANE,      // Clockwerk
    53: HeroRole.CORE,         // Nature's Prophet
    55: HeroRole.OFFLANE,      // Dark Seer
    65: HeroRole.OFFLANE,      // Batrider
    69: HeroRole.OFFLANE,      // Doom
    71: HeroRole.OFFLANE,      // Spirit Breaker
    88: HeroRole.OFFLANE,      // Nyx Assassin
    96: HeroRole.OFFLANE,      // Centaur Warrunner
    97: HeroRole.OFFLANE,      // Magnus
    100: HeroRole.OFFLANE,     // Tusk
    103: HeroRole.OFFLANE,     // Elder Titan
    107: HeroRole.OFFLANE,     // Earth Spirit
    108: HeroRole.OFFLANE,     // Underlord
    129: HeroRole.OFFLANE,     // Mars
    137: HeroRole.OFFLANE,     // Primal Beast

    // === SOFT SUPPORT (Pos 4) ===
    7: HeroRole.SOFT_SUPPORT,  // Earthshaker
    9: HeroRole.SOFT_SUPPORT,  // Mirana
    16: HeroRole.SOFT_SUPPORT, // Sand King
    20: HeroRole.SOFT_SUPPORT, // Vengeful Spirit
    21: HeroRole.SOFT_SUPPORT, // Windranger
    25: HeroRole.SOFT_SUPPORT, // Lina
    26: HeroRole.SOFT_SUPPORT, // Lion
    27: HeroRole.SOFT_SUPPORT, // Shadow Shaman
    40: HeroRole.SOFT_SUPPORT, // Venomancer
    62: HeroRole.SOFT_SUPPORT, // Bounty Hunter
    64: HeroRole.SOFT_SUPPORT, // Jakiro
    75: HeroRole.SOFT_SUPPORT, // Silencer
    79: HeroRole.SOFT_SUPPORT, // Shadow Demon
    84: HeroRole.SOFT_SUPPORT, // Ogre Magi
    85: HeroRole.SOFT_SUPPORT, // Undying
    86: HeroRole.SOFT_SUPPORT, // Rubick
    87: HeroRole.SOFT_SUPPORT, // Disruptor
    92: HeroRole.SOFT_SUPPORT, // Visage
    101: HeroRole.SOFT_SUPPORT,// Skywrath Mage
    102: HeroRole.SOFT_SUPPORT,// Abaddon
    105: HeroRole.OFFLANE,     // Techies (special case)
    110: HeroRole.SOFT_SUPPORT,// Phoenix
    119: HeroRole.SOFT_SUPPORT,// Dark Willow
    121: HeroRole.SOFT_SUPPORT,// Grimstroke
    123: HeroRole.SOFT_SUPPORT,// Hoodwink
    128: HeroRole.SOFT_SUPPORT,// Snapfire
    131: HeroRole.SOFT_SUPPORT,// Ringmaster
    136: HeroRole.SOFT_SUPPORT,// Marci

    // === HARD SUPPORT (Pos 5) ===
    3: HeroRole.HARD_SUPPORT,  // Bane
    5: HeroRole.HARD_SUPPORT,  // Crystal Maiden
    30: HeroRole.HARD_SUPPORT, // Witch Doctor
    31: HeroRole.HARD_SUPPORT, // Lich
    37: HeroRole.HARD_SUPPORT, // Warlock
    50: HeroRole.HARD_SUPPORT, // Dazzle
    57: HeroRole.HARD_SUPPORT, // Omniknight
    58: HeroRole.HARD_SUPPORT, // Enchantress
    66: HeroRole.HARD_SUPPORT, // Chen
    68: HeroRole.HARD_SUPPORT, // Ancient Apparition
    83: HeroRole.HARD_SUPPORT, // Treant Protector
    90: HeroRole.HARD_SUPPORT, // Keeper of the Light
    91: HeroRole.HARD_SUPPORT, // Io
    111: HeroRole.HARD_SUPPORT,// Oracle
    112: HeroRole.HARD_SUPPORT,// Winter Wyvern
    155: HeroRole.HARD_SUPPORT // Largo
};

/**
 * Get the expected KDA for a hero based on their role
 * @param heroId - The hero ID from OpenDota
 * @returns Expected KDA for that hero's typical role
 */
export function getExpectedKDA(heroId: number): number {
    const role = HERO_ROLES[heroId];
    if (role) {
        return ROLE_EXPECTED_KDA[role];
    }
    // Default to CORE if hero not found (new heroes)
    return ROLE_EXPECTED_KDA[HeroRole.CORE];
}

/**
 * Get the hero's primary role
 * @param heroId - The hero ID from OpenDota
 * @returns The hero's primary role
 */
export function getHeroRole(heroId: number): HeroRole {
    return HERO_ROLES[heroId] || HeroRole.CORE;
}

/**
 * Normalize a player's KDA based on the hero they played
 * Returns a value where 1.0 = average for that role
 * 
 * Example:
 * - Support with KDA 2.0 (expected 1.5) → 1.33 (above average)
 * - Carry with KDA 3.0 (expected 4.0) → 0.75 (below average)
 */
export function normalizeKDAForHero(kda: number, heroId: number): number {
    const expectedKDA = getExpectedKDA(heroId);
    return kda / expectedKDA;
}
