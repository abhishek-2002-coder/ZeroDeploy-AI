# Multi-Runtime Dockerfile for ZeroDeploy AI Backend
FROM node:24-slim

# Install Python and SSH
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4010

# Start server
CMD ["npm", "start"]
