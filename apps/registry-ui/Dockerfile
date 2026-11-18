FROM node:26.13.1-alpine AS auth-runtime
WORKDIR /app/auth
COPY auth/package.json auth/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY auth/src ./src

FROM node:26.13.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci --ignore-scripts
COPY . .
RUN npm run postinstall && npm run build

FROM node:26.13.1-alpine
RUN apk add --no-cache "zlib>=1.4-r0" \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/LICENSE ./LICENSE
COPY --from=auth-runtime --chown=node:node /app/auth ./auth
RUN mkdir -p /app/data /app/auth-data && chown node:node /app/data /app/auth-data
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
