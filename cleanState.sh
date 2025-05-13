#!/bin/bash

rm -rf data-volume/spaces/*
rm -rf data-volume/users/*
rm -rf ./data-volume/versionlessdsu
rm -rf ./data-volume/secrets/*
find ./data-volume/lightDB -mindepth 1 -type d ! -name 'FixedUrls.db' -exec rm -rf {} +
rm -rf ./data-volume/assets/*
rm -rf ./apihub-root/external-volume/balanceData
rm -rf ./apihub-root/external-volume/assistOS-logs
rm -rf ./apihub-root/external-volume/assistOS-audit
rm -rf ./apihub-root/external-volume/spaces