#!/bin/bash
# ==============================================================================
# CSBC 252 Capstone Project - Amazon EC2 Deployment Script
# Target OS: Amazon Linux 2023 / Ubuntu 22.04 LTS
# ==============================================================================

set -e

echo "[1/5] Updating system packages & installing Node.js runtime..."
if command -v yum &> /dev/null; then
    sudo yum update -y
    sudo yum install -y nodejs npm git
else
    sudo apt-get update -y
    sudo apt-get install -y nodejs npm git
fi

echo "[2/5] Setting up application directory..."
APP_DIR="/var/www/sales-tracker/backend"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER /var/www/sales-tracker

cd $APP_DIR

echo "[3/5] Installing production npm dependencies..."
npm install --production

echo "[4/5] Configuring systemd background service..."
sudo cp sales-backend.service /etc/systemd/system/sales-backend.service
sudo systemctl daemon-reload
sudo systemctl enable sales-backend
sudo systemctl restart sales-backend

echo "[5/5] Deployment complete! Checking backend status..."
sudo systemctl status sales-backend --no-pager
