FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine
# Server config is bind-mounted from infra/nginx/portal by docker compose.
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
