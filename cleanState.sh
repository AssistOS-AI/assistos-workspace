#!/bin/bash

rm -rf data-volume/spaces/*
rm -rf data-volume/users/*
echo "{}" > data-volume/[MAP]Spaces.json
echo "{}" > data-volume/[MAP]Users.json
echo "{}" > data-volume/user-credentials.json
echo "{}" > data-volume/UsersPendingActivation.json
echo "{}" > data-volume/SpacesPendingInvitations.json
rm -rf ./data-volume/versionlessdsu
rm -rf ./data-volume/secrets/*
find ./data-volume/lightDB -mindepth 1 -type d ! -name 'FixedUrls.db' -exec rm -rf {} +
rm -rf ./data-volume/assets/*
rm -rf ./apihub-root/external-volume/balanceData
rm -rf ./apihub-root/external-volume/assistOS-logs