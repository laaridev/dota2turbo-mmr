import axios from 'axios';

const OPENDOTA_API_URL = 'https://api.opendota.com/api';

// Turbo game mode ID is 23
const GAME_MODE_TURBO = 23;

export interface OpenDotaProfile {
    profile: {
        account_id: number;
        personaname: string;
        avatarfull: string;
        steamid: string; // 64-bit ID
        // ... potentially other fields
    };
    mmr_estimate?: {
        estimate: number;
    };
}

export interface OpenDotaMatch {
    match_id: number;
    player_slot: number;
    radiant_win: boolean;
    duration: number;
    game_mode: number;
    lobby_type: number;
    hero_id: number;
    start_time: number;
    version: number;
    kills: number;
    deaths: number;
    assists: number;
    skill?: number;
    leaver_status: number;
    party_size: number;
    average_rank?: number; // avg_rank_tier from OpenDota (0-80 scale)
}

export const opendota = {
    getPlayerProfile: async (steamId32: string) => {
        try {
            const response = await axios.get(`${OPENDOTA_API_URL}/players/${steamId32}`);
            return response.data as OpenDotaProfile;
        } catch (error) {
            console.error('Error fetching player profile:', error);
            throw error;
        }
    },

    getPlayerMatches: async (steamId32: string) => {
        try {
            // Fetch specifically Turbo matches
            const response = await axios.get(
                `${OPENDOTA_API_URL}/players/${steamId32}/matches?game_mode=${GAME_MODE_TURBO}&significant=0`
            );
            return response.data as OpenDotaMatch[];
        } catch (error) {
            console.error('Error fetching player matches:', error);
            throw error;
        }
    },

    /**
     * Helper to convert 64-bit Steam ID to 32-bit Account ID if necessary.
     * OpenDota usually takes the 32-bit ID (Account ID).
     * Simple BigInt subtraction: SteamID64 - 76561197960265728
     */
    steamId64to32: (steamId64: string): string => {
        // Check if it's already 32-bit (length usually < 12)
        if (steamId64.length < 12) return steamId64;
        try {
            const base = BigInt('76561197960265728');
            const id = BigInt(steamId64);
            return (id - base).toString();
        } catch (e) {
            return steamId64;
        }
    }
};
