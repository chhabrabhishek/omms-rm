FROM node:18-alpine

WORKDIR /frontend
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 3000
CMD yarn dev