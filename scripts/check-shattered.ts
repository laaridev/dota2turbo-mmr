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

async function check() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const Player = mongoose.model('Player', new mongoose.Schema({}, { strict: false }));

    // Find shattered love
    const player = await Player.findOne({ name: /shattered/i }).lean() as any;
    if (player) {
        console.log('\n=== Shattered Love ===');
        console.log('Name:', player.name);
        console.log('SteamId:', player.steamId);
        console.log('bestHeroId:', player.bestHeroId);
        console.log('bestHeroGames:', player.bestHeroGames);
        console.log('bestHeroWinrate:', player.bestHeroWinrate);
        console.log('TMMR:', player.tmmr);
    } else {
        console.log('Player not found');
    }

    // Show all players with bestHeroId set
    console.log('\n=== Players with bestHeroId ===');
    const playersWithHero = await Player.find({ bestHeroId: { $gt: 0 } }).lean() as any[];
    for (const p of playersWithHero.slice(0, 10)) {
        console.log(`${p.name}: Hero ${p.bestHeroId}, ${p.bestHeroGames} games, ${p.bestHeroWinrate}% WR`);
    }
    console.log(`Total: ${playersWithHero.length} players with bestHeroId`);

    await mongoose.disconnect();
}
check();
