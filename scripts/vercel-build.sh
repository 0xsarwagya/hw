#!/bin/bash

# Vercel Build Script
# Handles vercel build with production flag when needed

set -e

if [ "$VERCEL_ENV" = "production" ]; then
  vercel build --prod --token=$VERCEL_TOKEN
else
  vercel build --token=$VERCEL_TOKEN
fi

