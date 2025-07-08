#!/bin/bash

find ./apihub-root/external-volume/lightDB -mindepth 1 -type d ! -name 'FixedUrls.db' -exec rm -rf {} +
rm -rf ./apihub-root/external-volume/balanceData
rm -rf ./apihub-root/external-volume/assistOS-logs
rm -rf ./apihub-root/external-volume/assistOS-audit
rm -rf ./apihub-root/external-volume/spaces
rm -rf ./apihub-root/external-volume/secrets/*
rm -rf ./apihub-root/external-volume/systemApps