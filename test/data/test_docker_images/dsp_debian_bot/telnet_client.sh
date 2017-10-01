#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        telnet_client.sh [--name=val] [ --password=val]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage telnet_client.sh [--name=val] [ --password=val] [--commands=commands] [--ip_telnet_server=ip_telnet_server]"
 
exit 1
}
Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --name=*)
      NAME=${ARG#*=} 
      ;;
    --commands=*)
      COMMANDS=${ARG#*=} 
      ;;
    --ip_telnet_server=*)
      TELNET_SERVER=${ARG#*=} 
      ;;
    --password=*)
      PASSWORD=${ARG#*=} 
      ;;
    *)
      echo "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 4 ]; then
   usage "args must be 4"
fi




while true; do

	eval "{ echo; 
		sleep 3;
		echo $NAME ; 
		sleep 1; 
		echo $PASSWORD ; 
		sleep 1; 
		echo $COMMANDS ; 
		sleep 1; }" | telnet $TELNET_SERVER



done;
