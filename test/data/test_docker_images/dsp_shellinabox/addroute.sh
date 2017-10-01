#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        bash.sh [-a|--alpha] [-b=val|--beta=val]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage addroute.sh [--router_ip=val] [ --subnet=val]"
exit 1
}

# Parse Parameters #
for ARG in $*; do
  case $ARG in
    --router_ip=*)
      ROUTER=${ARG#*=} 
      ;;
    --subnet=*)
      SUBNET=${ARG#*=} 
      ;;
    *)
      echo "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 2 ]; then
   usage "args must be 2"
fi

# Do Some Stuff #

#ex 192.168.1.1/24
ip route add $SUBNET via $ROUTER
