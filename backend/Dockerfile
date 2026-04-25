# Build stage
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Expose port and run
EXPOSE 5000
CMD ["node", "src/server.js"]
