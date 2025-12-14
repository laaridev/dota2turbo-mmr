#!/bin/bash

echo "🚀 Running Ranking Stats Migration..."
echo ""

curl -X POST "https://dotaturbo.vercel.app/api/migrate-rankings" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  2>/dev/null | jq .

echo ""
echo "✅ Migration complete!"
echo ""
echo "To verify, check:"
echo "  https://dotaturbo.vercel.app/leaderboard?mode=winrate"
echo "  https://dotaturbo.vercel.app/leaderboard?mode=performance"
echo "  https://dotaturbo.vercel.app/leaderboard?mode=pro"
