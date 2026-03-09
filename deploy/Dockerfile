FROM alpine:3.23.3

RUN apk add --no-cache --update ca-certificates git docker docker-compose openrc nodejs npm && rm -rf /var/cache/apk/* && mkdir -p /app


RUN git clone -b update-version https://github.com/DockerSecurityPlayground/DSP.git /app
WORKDIR /app


RUN npm install 

ENV DSP_IFACE=0.0.0.0
ENV DSP_AUTOINSTALL=1 


ENTRYPOINT ["npm", "start"]
