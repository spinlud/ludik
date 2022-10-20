FROM node:12-buster-slim

RUN apt-get update && apt-get install -y \
    bzip2

WORKDIR app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 8080

CMD npm run start