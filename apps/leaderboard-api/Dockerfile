FROM node:20-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/leaderboard-api/ apps/leaderboard-api/
RUN npm i -g pnpm && pnpm install --frozen-lockfile
RUN cd apps/leaderboard-api && pnpm build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/apps/leaderboard-api/dist/ ./dist/
EXPOSE 3001
ENV PORT=3001
ENV LEADERBOARD_STORAGE=file
ENV LEADERBOARD_FILE_PATH=/app/data/leaderboard.json
CMD ["node", "dist/server.js"]
