#!/bin/bash
set -euo pipefail

npm run build
rm -rf public
mkdir public
cp -r index.html dist public/

npx surge public https://rclone-size.surge.sh
