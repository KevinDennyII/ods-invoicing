FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

# Never run the portal API as root.
USER node

EXPOSE 8080
CMD ["node", "src/index.js"]
