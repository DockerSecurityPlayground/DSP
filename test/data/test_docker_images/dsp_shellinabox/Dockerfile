FROM sspreitzer/shellinabox 
RUN sudo apt-get update && sudo apt-get install -y vim nano vsftpd xinetd ftp \
net-tools iputils-ping telnet tcpdump nmap  ssh fping dsniff ftp \ 
gcc make build-essential bsdmainutils hydra john

COPY addroute.sh /addroute.sh


ENV SIAB_USER=student
ENV SIAB_PASSWORD=student
ENV SIAB_SUDO=true
ENV SIAB_SSL=false


LABEL ports="4200" \
	actions.addroute.command="/addroute.sh" \ 
      actions.addroute.description="Add a new route for the subnet : set router ip and subnet " \ 
      actions.addroute.args.subnet.val="192.168.1.2/24" \
      actions.addroute.args.subnet.type="text" \
      actions.addroute.args.router_ip.val="" \
      actions.addroute.args.router_ip.type="text" \
