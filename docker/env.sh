#!/bin/sh

# This script injects environment variables into the built React app
# Useful for runtime configuration in Docker containers

# Create a config file that will be loaded by the app
cat <<EOF > /usr/share/nginx/html/config.js
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8000/api/v1}",
  VITE_APP_NAME: "${VITE_APP_NAME:-NextGenCRM}",
  VITE_APP_VERSION: "${VITE_APP_VERSION:-1.0.0}"
};
EOF

echo "Environment configuration created:"
cat /usr/share/nginx/html/config.js