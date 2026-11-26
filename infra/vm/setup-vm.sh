#!/usr/bin/env bash
# One-time setup for the worker VM (Debian 12). Run on the VM as root:
#   sudo bash setup-vm.sh
set -euo pipefail

# 1. Swap: the e2-micro has 1 GB of RAM.
if ! swapon --show | grep -q /swapfile; then
	fallocate -l 2G /swapfile
	chmod 600 /swapfile
	mkswap /swapfile
	swapon /swapfile
	echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 2. Docker Engine and the compose plugin from Docker's apt repository.
if ! command -v docker > /dev/null; then
	apt-get update
	apt-get install -y ca-certificates curl
	install -m 0755 -d /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
	chmod a+r /etc/apt/keyrings/docker.asc
	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
		> /etc/apt/sources.list.d/docker.list
	apt-get update
	apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

# 3. Deploy directory and the env file the worker container reads.
install -d -m 755 /opt/invoice
if [ ! -f /opt/invoice/worker.env ]; then
	install -m 600 /dev/null /opt/invoice/worker.env
	echo "Created /opt/invoice/worker.env. Fill it in (see infra/vm/worker.env.example)."
fi
