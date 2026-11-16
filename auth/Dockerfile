FROM node:26.13.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src
RUN apk add --no-cache "zlib>=1.4-r0" \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
  && mkdir /data \
  && chown node:node /data
USER node
ENV HOST=0.0.0.0 PORT=8080 AUTH_DATA_DIR=/data
EXPOSE 8080
CMD ["node", "src/server.mjs"]
