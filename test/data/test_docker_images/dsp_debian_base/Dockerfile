FROM debian:latest

RUN apt-get update && apt-get install -y net-tools vim nano
COPY adduser.sh /adduser.sh
COPY setgw.sh /setgw.sh
COPY addctf.sh /addctf.sh
CMD /bin/sh

LABEL \
	actions.adduser.command="/adduser.sh" \ 
      actions.adduser.description="Add a new username : <name> <password> " \ 
      actions.adduser.args.name.val="user" \
      actions.adduser.args.name.type="text" \
      actions.adduser.args.password.val="user" \
      actions.adduser.args.password.type="text" \

	actions.addctf.command="/addctf.sh" \ 
      actions.addctf.description="Add a ctf in /home/<username> directory inside a secret file" \ 
      actions.addctf.args.username.val="" \
      actions.addctf.args.username.type="text" \
      actions.addctf.args.ctf.val="" \
      actions.addctf.args.ctf.type="text" \

      actions.setgw.command="/setgw.sh" \ 
      actions.setgw.description="Set default gateway  <name container gateway> " \ 
      actions.setgw.args.gateway.val="" \
      actions.setgw.args.gateway.type="text" \
