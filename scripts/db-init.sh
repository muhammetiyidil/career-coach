#!/usr/bin/env bash
set -euo pipefail

SERVER="${MSSQL_HOST:-mssql}"
PW="${MSSQL_SA_PASSWORD:-CareerCoach#2026!}"
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

echo "Waiting for SQL Server at ${SERVER}..."
for i in $(seq 1 45); do
  if $SQLCMD -S "$SERVER" -U sa -P "$PW" -C -d master -Q "SELECT 1" >/dev/null 2>&1; then
    echo "SQL Server is ready."
    break
  fi
  sleep 2
done

echo "Ensuring CareerCoachDB exists..."
$SQLCMD -S "$SERVER" -U sa -P "$PW" -C -d master -Q "IF DB_ID('CareerCoachDB') IS NULL CREATE DATABASE CareerCoachDB;"
sleep 3

TABLE_COUNT=$($SQLCMD -S "$SERVER" -U sa -P "$PW" -C -d CareerCoachDB -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables" | tr -d '[:space:]')

if [ "${TABLE_COUNT:-0}" = "0" ]; then
  echo "Applying script.sql..."
  $SQLCMD -S "$SERVER" -U sa -P "$PW" -C -d CareerCoachDB -i /scripts/script.sql
else
  echo "Database already initialized (${TABLE_COUNT} tables). Skipping script.sql."
fi

echo "Database init complete."
