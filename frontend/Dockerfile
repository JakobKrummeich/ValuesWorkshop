FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend/ frontend/
RUN pnpm --filter frontend build

FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=build /app/frontend/.next/standalone/ ./
COPY --from=build /app/frontend/.next/static frontend/.next/static
COPY --from=build /app/frontend/public frontend/public/

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "frontend/server.js"]
