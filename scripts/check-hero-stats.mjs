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
    46: "Templar Assassin", 74: "Invoker"  // Add more as needed
};

async function fetchMatches(accountId) {
    const url = `https://api.opendota.com/api/players/${accountId}/matches?game_mode=23&significant=0`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    return await res.json();
}

async function calculateBestHero(matches) {
    const heroMap = new Map();
    
    for (const m of matches) {
        if (m.duration < 480) continue; // Skip short games
        
        const heroId = m.hero_id;
        const isWin = (m.player_slot < 128) === m.radiant_win;
        
        const stats = heroMap.get(heroId) || { wins: 0, games: 0 };
        stats.games++;
        if (isWin) stats.wins++;
        heroMap.set(heroId, stats);
    }
    
    console.log('\n=== Hero Stats for Shattered Love ===');
    const sorted = Array.from(heroMap.entries())
        .map(([heroId, stats]) => ({
            heroId,
            heroName: HERO_NAMES[heroId] || `Hero ${heroId}`,
            games: stats.games,
            wins: stats.wins,
            winrate: (stats.wins / stats.games * 100).toFixed(1)
        }))
        .filter(h => h.games >= 10)
        .sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));
    
    for (const h of sorted.slice(0, 15)) {
        console.log(`${h.heroName} (ID ${h.heroId}): ${h.games} games, ${h.wins} wins, ${h.winrate}% WR`);
    }
    
    if (sorted.length > 0) {
        console.log('\nBest Hero:', sorted[0]);
    }
}

async function check() {
    // Shattered Love account ID
    const accountId = '1838936065';
    
    const matches = await fetchMatches(accountId);
    console.log(`Fetched ${matches.length} turbo matches`);
    
    await calculateBestHero(matches);
}

check();
