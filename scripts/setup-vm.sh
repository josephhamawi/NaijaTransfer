#!/bin/bash
# ─────────────────────────────────────────────────────────
# NigeriaTransfer — Oracle ARM VM Setup Script
# Run once on a fresh Ubuntu 22.04 ARM64 VM.
# ─────────────────────────────────────────────────────────

set -euo pipefail

echo "=========================================="
echo " NigeriaTransfer VM Setup"
echo "=========================================="

# Update system
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "[2/8] Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Node.js 20 LTS
echo "[3/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "[4/8] Installing PM2..."
sudo npm install -g pm2

# Install Caddy
echo "[5/8] Installing Caddy..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Install AWS CLI (for R2 operations)
echo "[6/8] Installing AWS CLI..."
sudo apt install -y awscli

# Create application directory
echo "[7/8] Setting up application directory..."
sudo mkdir -p /opt/nigeriatransfer
sudo chown $USER:$USER /opt/nigeriatransfer
sudo mkdir -p /var/log/nigeriatransfer
sudo chown $USER:$USER /var/log/nigeriatransfer

# Mount block storage (if attached)
echo "[8/8] Setting up block storage..."
sudo mkdir -p /mnt/uploads
# NOTE: Block storage device needs to be formatted and mounted manually:
# sudo mkfs.ext4 /dev/sdb
# echo '/dev/sdb /mnt/uploads ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
# sudo mount -a
sudo chown $USER:$USER /mnt/uploads

# Start PostgreSQL in Docker
echo "[+] Starting PostgreSQL..."
docker run -d \
  --name nigeriatransfer-db \
  --restart unless-stopped \
  -e POSTGRES_USER=nigeriatransfer \
  -e POSTGRES_PASSWORD=\${DB_PASSWORD:-changeme} \
  -e POSTGRES_DB=nigeriatransfer \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

echo ""
echo "=========================================="
echo " Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Clone the repo: cd /opt/nigeriatransfer && git clone <repo-url> ."
echo "  2. Copy .env.example to .env and fill in secrets"
echo "  3. npm ci && npx prisma migrate deploy && npm run build"
echo "  4. Copy Caddyfile to /etc/caddy/Caddyfile and restart Caddy"
echo "  5. pm2 start ecosystem.config.js"
echo "  6. pm2 save && pm2 startup"
echo ""
