
FROM node:20-alpine
WORKDIR /app

RUN npm install pm2 -g

COPY package.json yarn.lock* ./

RUN yarn install --production --frozen-lockfile


COPY Backend/ ./Backend/

COPY ecosystem.config.js ./

EXPOSE 3000
EXPOSE 5500

CMD ["pm2-runtime", "ecosystem.config.js"]