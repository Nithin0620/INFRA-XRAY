# Multi-runtime Dockerfile (Node.js 20 + Python 3 + OpenCV & PDF utilities)
FROM node:20-slim

# Install Python 3, pip, venv, and system libraries for OpenCV & PDF processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setup Python Virtual Environment and install AI/ML dependencies
COPY python-worker/requirements.txt ./python-worker/requirements.txt
RUN python3 -m venv /app/python-worker/.venv && \
    /app/python-worker/.venv/bin/pip install --no-cache-dir -r ./python-worker/requirements.txt

# 2. Setup Node.js backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# 3. Copy source code and initial data
COPY shared/ ./shared/
COPY scripts/ ./scripts/
COPY python-worker/ ./python-worker/
COPY backend/ ./backend/
COPY data/ ./data/

# Ensure proper execute permissions for scripts
RUN chmod -R 755 /app/python-worker

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

# Start the Express API server (serves API & static data assets)
CMD ["node", "backend/src/server.js"]
