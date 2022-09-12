FROM node:14.19.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY /apps/api/package.json ./
RUN npm i && npm cache clean --force
COPY /dist/apps/api ./dist
EXPOSE 3333
CMD ["node", "dist/main" ]