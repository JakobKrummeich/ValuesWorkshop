#!/usr/bin/env bash
set -euo pipefail

VERSION="2.5.1"
INSTALL_DIRECTORY="${PWD}/.tools/osv-scanner/${VERSION}"
BINARY="${INSTALL_DIRECTORY}/osv-scanner"

case "$(uname -s)/$(uname -m)" in
  Linux/x86_64) ASSET="osv-scanner_linux_amd64"; CHECKSUM="f9f25499a2c8cc367b3af45df2ea7eeca7fbccceab9c35079968f4b3652194be" ;;
  Linux/aarch64) ASSET="osv-scanner_linux_arm64"; CHECKSUM="3d0f5aa5a6baa8eb32bcef247388e149ef6030a6634ccae6fa0d62681fb27a6d" ;;
  Darwin/x86_64) ASSET="osv-scanner_darwin_amd64"; CHECKSUM="9f89beb6c3d784893cb1cae0a3d56c529bfe91075418c2f9440c45b79654198b" ;;
  Darwin/arm64) ASSET="osv-scanner_darwin_arm64"; CHECKSUM="75c44d6332f892a1e56286f4105a98ed751ae28d215ca0a8b65cc00d84103054" ;;
  *)
    echo "osv-scanner ${VERSION} is not pinned for $(uname -s)/$(uname -m)." >&2
    exit 1
    ;;
esac

verify() {
  echo "${CHECKSUM}  ${BINARY}" | shasum -a 256 --check --status
}

if [ -x "${BINARY}" ] && verify; then
  echo "${BINARY}"
  exit 0
fi

mkdir -p "${INSTALL_DIRECTORY}"
DOWNLOAD="${BINARY}.download"
curl --silent --show-error --location --fail --retry 3 --retry-delay 5 \
  --output "${DOWNLOAD}" \
  "https://github.com/google/osv-scanner/releases/download/v${VERSION}/${ASSET}"
mv "${DOWNLOAD}" "${BINARY}"
chmod +x "${BINARY}"

if ! verify; then
  rm -f "${BINARY}"
  echo "The downloaded osv-scanner ${VERSION} does not match the pinned checksum ${CHECKSUM}." >&2
  exit 1
fi

echo "${BINARY}"
