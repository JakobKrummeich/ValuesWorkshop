FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN echo 'allowBuilds:\n  sharp: true\n  unrs-resolver: true' > pnpm-workspace.yaml && \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=build /app/.next/standalone/ ./
COPY --from=build /app/.next/static .next/static
COPY --from=build /app/public public/

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
