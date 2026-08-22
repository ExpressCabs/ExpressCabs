FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma

RUN npm ci

COPY backend/ ./

# sitemapRoutes.js expects:
# ../../frontend/src/data/melbourneSuburbs.json
#
# From /app/routes this resolves to:
# /frontend/src/data/melbourneSuburbs.json

RUN mkdir -p /frontend/src/data

COPY frontend/src/data/melbourneSuburbs.json \
     /frontend/src/data/melbourneSuburbs.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
