/**
 * Script para recalcular heroStats de todos os jogadores
 * Isso vai popular o campo heroStats para o ranking de especialistas
 */

import mongoose from 'mongoose';
import * as fs from 'fs';

// Load env manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
    }
}

const HERO_NAMES = {
    1: "Anti-Mage", 2: "Axe", 3: "Bane", 4: "Bloodseeker", 5: "Crystal Maiden",
    6: "Drow Ranger", 7: "Earthshaker", 8: "Juggernaut", 9: "Mirana", 10: "Morphling",
    11: "Shadow Fiend", 12: "Phantom Lancer", 13: "Puck", 14: "Pudge", 15: "Razor",
    16: "Sand King", 17: "Storm Spirit", 18: "Sven", 19: "Tiny", 20: "Vengeful Spirit",
    21: "Windranger", 22: "Zeus", 23: "Kunkka", 25: "Lina", 26: "Lion",
    27: "Shadow Shaman", 28: "Slardar", 29: "Tidehunter", 30: "Witch Doctor", 31: "Lich",
    32: "Riki", 33: "Enigma", 34: "Tinker", 35: "Sniper", 36: "Necrophos",
    37: "Warlock", 38: "Beastmaster", 39: "Queen of Pain", 40: "Venomancer", 41: "Faceless Void",
    42: "Wraith King", 43: "Death Prophet", 44: "Phantom Assassin", 45: "Pugna", 46: "Templar Assassin",
    47: "Viper", 48: "Luna", 49: "Dragon Knight", 50: "Dazzle", 51: "Clockwerk",
    52: "Leshrac", 53: "Nature's Prophet", 54: "Lifestealer", 55: "Dark Seer", 56: "Clinkz",
    57: "Omniknight", 58: "Enchantress", 59: "Huskar", 60: "Night Stalker", 61: "Broodmother",
    62: "Bounty Hunter", 63: "Weaver", 64: "Jakiro", 65: "Batrider", 66: "Chen",
    67: "Spectre", 68: "Ancient Apparition", 69: "Doom", 70: "Ursa", 71: "Spirit Breaker",
    72: "Gyrocopter", 73: "Alchemist", 74: "Invoker", 75: "Silencer", 76: "Outworld Destroyer",
    77: "Lycan", 78: "Brewmaster", 79: "Shadow Demon", 80: "Lone Druid", 81: "Chaos Knight",
    82: "Meepo", 83: "Treant Protector", 84: "Ogre Magi", 85: "Undying", 86: "Rubick",
    87: "Disruptor", 88: "Nyx Assassin", 89: "Naga Siren", 90: "Keeper of the Light", 91: "Io",
    92: "Visage", 93: "Slark", 94: "Medusa", 95: "Troll Warlord", 96: "Centaur Warrunner",
    97: "Magnus", 98: "Timbersaw", 99: "Bristleback", 100: "Tusk", 101: "Skywrath Mage",
    102: "Abaddon", 103: "Elder Titan", 104: "Legion Commander", 105: "Techies", 106: "Ember Spirit",
    107: "Earth Spirit", 108: "Underlord", 109: "Terrorblade", 110: "Phoenix", 111: "Oracle",
    112: "Winter Wyvern", 113: "Arc Warden", 114: "Monkey King", 119: "Dark Willow", 120: "Pangolier",
    121: "Grimstroke", 123: "Hoodwink", 126: "Void Spirit", 128: "Snapfire", 129: "Mars",
    131: "Ringmaster", 135: "Dawnbreaker", 136: "Marci", 137: "Primal Beast", 138: "Muerta"
};

const MIN_HERO_GAMES = 50;

async function fetchMatches(accountId) {
    const url = `https://api.opendota.com/api/players/${accountId}/matches?game_mode=23&significant=0`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
    }
    return await res.json();
}

function steamId64to32(steamId64) {
    if (steamId64.length <= 10) return steamId64;
    const bigId = BigInt(steamId64);
    const id32 = bigId - BigInt('76561197960265728');
    return id32.toString();
}

function calculateHeroStats(matches) {
    const heroMap = new Map();

    const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

    for (const m of validMatches) {
        const heroId = m.hero_id;
        const isWin = (m.player_slot < 128) === m.radiant_win;

        const stats = heroMap.get(heroId) || { wins: 0, games: 0, kills: 0, deaths: 0, assists: 0 };
        stats.games++;
        if (isWin) stats.wins++;
        stats.kills += m.kills || 0;
        stats.deaths += m.deaths || 0;
        stats.assists += m.assists || 0;
        heroMap.set(heroId, stats);
    }

    // Build heroStats array (only heroes with 50+ games)
    const heroStats = Array.from(heroMap.entries())
        .filter(([, stats]) => stats.games >= MIN_HERO_GAMES)
        .map(([heroId, stats]) => ({
            heroId,
            heroName: HERO_NAMES[heroId] || `Hero ${heroId}`,
            games: stats.games,
            wins: stats.wins,
            winrate: parseFloat(((stats.wins / stats.games) * 100).toFixed(2)),
            avgKDA: `${(stats.kills / stats.games).toFixed(1)}/${(stats.deaths / stats.games).toFixed(1)}/${(stats.assists / stats.games).toFixed(1)}`
        }))
        .sort((a, b) => b.winrate - a.winrate);

    return heroStats;
}

async function main() {
    console.log('========================================');
    console.log('Recalculate Hero Stats for All Players');
    console.log('========================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const Player = mongoose.model('Player', new mongoose.Schema({}, { strict: false }));

    // Get all players
    const players = await Player.find({ isPrivate: { $ne: true } }).lean();
    console.log(`Found ${players.length} players to process\n`);

    let processed = 0;
    let withHeroStats = 0;
    let errors = 0;

    for (const player of players) {
        try {
            process.stdout.write(`[${processed + 1}/${players.length}] ${player.name}... `);

            const accountId = steamId64to32(player.steamId);
            const matches = await fetchMatches(accountId);

            if (!matches || matches.length === 0) {
                console.log('No matches - skipped');
                processed++;
                continue;
            }

            const heroStats = calculateHeroStats(matches);

            // Update player with heroStats
            let bestHeroId = player.bestHeroId || 0;
            let bestHeroGames = player.bestHeroGames || 0;
            let bestHeroWinrate = player.bestHeroWinrate || 0;

            if (heroStats.length > 0) {
                bestHeroId = heroStats[0].heroId;
                bestHeroGames = heroStats[0].games;
                bestHeroWinrate = heroStats[0].winrate;
                withHeroStats++;
            }

            await Player.updateOne(
                { steamId: player.steamId },
                {
                    $set: {
                        heroStats,
                        bestHeroId,
                        bestHeroGames,
                        bestHeroWinrate
                    }
                }
            );

            console.log(`✅ ${heroStats.length} heroes with 50+ games`);
            processed++;

            // Rate limit - 1 second between requests
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            errors++;
            processed++;
            await new Promise(r => setTimeout(r, 2000)); // Extra delay on error
        }
    }

    console.log('\n========================================');
    console.log('Hero Stats Migration Complete!');
    console.log(`Processed: ${processed}`);
    console.log(`With hero stats (50+ games): ${withHeroStats}`);
    console.log(`Errors: ${errors}`);
    console.log('========================================');

    await mongoose.disconnect();
}

main();
