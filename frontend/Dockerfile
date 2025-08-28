FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN rm -rf node_modules && yarn install --immutable --immutable-cache --check-cache --network-timeout 100000

COPY . .

RUN yarn build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3000

CMD ["yarn", "start"]