# syntax=docker/dockerfile:1

# ---- Build stage -------------------------------------------------------------
FROM node:lts-alpine AS build
WORKDIR /app

# Install dependencies first to take advantage of the layer cache.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# The API URL is baked into the bundle at build time (Vite env variables).
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- Runtime stage -----------------------------------------------------------
FROM nginx:alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
