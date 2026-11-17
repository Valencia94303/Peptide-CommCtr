# Peptide Command Center — Railway image.
# Build context is the REPO ROOT (see ../railway.toml), so the image can also
# carry the legacy single-file app that Phase 1 serves at "/".
FROM node:20-slim AS build
WORKDIR /app
COPY railway-app/package.json railway-app/package-lock.json* ./
RUN npm ci || npm install
COPY railway-app/ .
RUN npm run build

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
# Legacy app (Phase 1): served at "/" with no-cache headers.
COPY index.html onboarding.html sw.js manifest.json icon.svg ./legacy/
EXPOSE 8080
CMD ["npx", "tsx", "src/server/index.ts"]
