# Stage 1: Build (Frontend)
FROM node:20-alpine AS build-stage

# Define ARGs for build-time (Frontend needs these baked in)
ARG VITE_USER_API_URL
ARG VITE_UTILS_API_URL
ARG VITE_PROBLEM_SETS_API_URL
ARG VITE_ROOM_MANAGEMENT_API_URL
ARG REACT_APP_SOCKET_SERVER_PORT
ARG REACT_APP_SERVER_PORT
ARG REACT_APP_SOCKET_SERVER_URL
ARG REACT_APP_URL

# Set them as ENVs so the 'yarn build' process can see them
ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV VITE_UTILS_API_URL=$VITE_UTILS_API_URL
ENV VITE_PROBLEM_SETS_API_URL=$VITE_PROBLEM_SETS_API_URL
ENV VITE_ROOM_MANAGEMENT_API_URL=$VITE_ROOM_MANAGEMENT_API_URL
ENV REACT_APP_SOCKET_SERVER_PORT=$REACT_APP_SOCKET_SERVER_PORT
ENV REACT_APP_SERVER_PORT=$REACT_APP_SERVER_PORT
ENV REACT_APP_SOCKET_SERVER_URL=$REACT_APP_SOCKET_SERVER_URL
ENV REACT_APP_URL=$REACT_APP_URL

WORKDIR /app
COPY package.json yarn.lock* ./
COPY Frontend/package.json Frontend/yarn.lock* ./Frontend/

RUN yarn install --frozen-lockfile
RUN cd Frontend && yarn install --frozen-lockfile

COPY . .
RUN yarn build-prod

FROM node:20-alpine
WORKDIR /app

RUN npm install pm2 -g

COPY package.json yarn.lock* ./
RUN yarn install --production --frozen-lockfile

COPY --from=build-stage /app/Frontend/dist ./dist 

COPY Backend/ ./Backend/

COPY ecosystem.config.js ./

EXPOSE 5500
EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]