# Dockerfile untuk Gembok Bill
# Build dengan: docker build -t gembok-bill .
# Run dengan: docker run -d -p 3002:3002 --name gembok-bill gembok-bill

FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install sistem dependencies untuk native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libsqlite3-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies dengan rebuild otomatis
RUN npm install && npm rebuild

# Copy aplikasi files
COPY . .

# Create required directories
RUN mkdir -p data/backup logs whatsapp-session

# Set permissions
RUN chmod 755 data/ logs/ whatsapp-session/ && \
    chmod 644 settings.json

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002 || exit 1

# Start aplikasi
CMD ["npm", "start"]
