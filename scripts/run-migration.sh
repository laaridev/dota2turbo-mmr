#!/bin/bash

echo "🚀 Starting TMMR v3.0 Migration (batched)..."
echo ""

SKIP=0
BATCH_SIZE=5
BASE_URL="https://dotaturbo.vercel.app/api/migrate"

while true; do
    echo "⚙️  Processing batch starting at $SKIP..."
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}?batch=${BATCH_SIZE}&skip=${SKIP}")
    
    # Check if done
    DONE=$(echo "$RESPONSE" | jq -r '.done // false')
    PROCESSED=$(echo "$RESPONSE" | jq -r '.stats.processed // 0')
    TOTAL=$(echo "$RESPONSE" | jq -r '.stats.total // 0')
    
    echo "   Processed: $PROCESSED players"
    echo "   Progress: $SKIP/$TOTAL"
    
    if [ "$DONE" = "true" ]; then
        echo ""
        echo "✅ Migration complete!"
        echo "📊 Total players: $TOTAL"
        break
    fi
    
    # Get next skip value
    SKIP=$(echo "$RESPONSE" | jq -r '.stats.skip // 0')
    
    if [ "$SKIP" = "0" ]; then
        echo "❌ Error: No progress, stopping"
        break
    fi
    
    # Small delay to avoid rate limiting
    sleep 2
done

echo ""
echo "✨ Done! Check the leaderboard:"
echo "   https://dotaturbo.vercel.app/leaderboard"
