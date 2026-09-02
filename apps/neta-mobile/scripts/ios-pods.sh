#!/bin/sh

set -eu

RUBY_ROOT="/opt/homebrew/opt/ruby@3.4"
BUNDLE_BIN="$RUBY_ROOT/bin/bundle"

if [ ! -x "$BUNDLE_BIN" ]; then
  echo "Ruby 3.4 bulunamadı. Önce 'brew install ruby@3.4' çalıştırın." >&2
  exit 1
fi

cd "$(dirname "$0")/.."

if [ ! -f ios/Podfile ]; then
  pnpm exec expo prebuild --platform ios --no-install
fi

"$BUNDLE_BIN" config set --local path vendor/bundle
"$BUNDLE_BIN" check || "$BUNDLE_BIN" install

cd ios
"$BUNDLE_BIN" exec pod install
