FROM node:18.12.1-slim

ENV RADARR_URL='http://radarr:7878'
ENV RADARR_API_KEY=12345
ENV WAIT_TIME=600000
ENV DOWNLOAD_TIME=10800000
ENV FILE_SIE=4294967296
ENV CRON_SCHEDULE='*/5 * * * *'

WORKDIR /app

COPY package*.json ./

RUN npm install node-fetch@2

#RUN npm install pm2

RUN npm install pm2 -g

#RUN apt-get update && apt-get install -y procps

#RUN apt-get update && apt-get install -y cron gettext-base

COPY . .

#RUN chmod 0644 /app/crontab

RUN chmod +x /app/radarr-checkerr.js

#RUN chmod +x /app/start.sh

RUN chmod +x /app/1.sh

#RUN touch /var/log/crontab.log

EXPOSE 3006

ENTRYPOINT ["/app/1.sh"]
