FROM node:26.13.1-alpine AS build
WORKDIR /repo/apps/website
COPY apps/website/package.json apps/website/package-lock.json ./
COPY apps/website/vendor ./vendor
RUN npm ci --ignore-scripts
COPY apps/website/ ./
COPY docs/ /repo/docs/
RUN npm run postinstall && npm run build

FROM node:26.13.1-alpine
RUN apk add --no-cache "zlib>=1.4-r0" \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /repo/apps/website/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
