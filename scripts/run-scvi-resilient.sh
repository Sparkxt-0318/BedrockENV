#!/bin/bash
# Resilient SCVI runner — automatically restarts from checkpoint when killed.
# The TypeScript script saves checkpoints and skips completed counties on resume.

LOG="/tmp/scvi-national-run.log"
MAX_RESTARTS=200
RESTART_COUNT=0

echo "$(date): Resilient SCVI runner starting (max $MAX_RESTARTS restarts)" >> "$LOG"

while [ "$RESTART_COUNT" -lt "$MAX_RESTARTS" ]; do
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "$(date): === Attempt $RESTART_COUNT ===" >> "$LOG"

  npx tsx scripts/build-scvi-national.ts 2>> "$LOG"
  EXIT_CODE=$?

  # Check if the script completed successfully (wrote final output)
  if [ -f "data/scvi-national.json" ]; then
    echo "$(date): Run completed successfully after $RESTART_COUNT attempts" >> "$LOG"
    exit 0
  fi

  echo "$(date): Process exited with code $EXIT_CODE, restarting in 5s (attempt $RESTART_COUNT)..." >> "$LOG"
  sleep 5
done

echo "$(date): Exceeded max restarts ($MAX_RESTARTS)" >> "$LOG"
exit 1
