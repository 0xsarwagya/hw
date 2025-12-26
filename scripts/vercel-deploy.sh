#!/bin/bash

# Vercel Deploy Script
# Handles vercel deploy --prebuilt and captures deployment URLs
# Usage: ./scripts/vercel-deploy.sh -n app-name -o output-file.md

set -e

# Parse arguments
NAME=""
OUTPUT=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--name)
      NAME="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$NAME" ]; then
  echo "Error: App name is required (-n or --name)"
  exit 1
fi

if [ -z "$OUTPUT" ]; then
  echo "Error: Output file is required (-o or --output)"
  exit 1
fi

# Deploy and save stdout and stderr to files
if [ "$VERCEL_ENV" = "production" ]; then
  vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN >_tmp_deployment-url.txt 2>_tmp_error.txt
else
  vercel deploy --prebuilt --token=$VERCEL_TOKEN >_tmp_deployment-url.txt 2>_tmp_error.txt
fi

# Check the exit code
code=$?
if [ $code -eq 0 ]; then
  deploymentUrl=$(cat _tmp_deployment-url.txt)
  echo "$NAME: <$deploymentUrl>" >> ${OUTPUT}
  echo "Deployed $GITHUB_REF on $NAME: $deploymentUrl"
else
  echo "ERROR: There was an issue deploying $NAME:"
  cat _tmp_error.txt
  exit 1
fi

