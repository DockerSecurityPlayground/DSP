#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        setgw.sh  [--gw=namegateway]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage addrouter.sh [--gateway=val] "
exit 1
}

Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --gateway=*)
      GW=${ARG#*=} 
      ;;
    *)
      usage "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 1 ]; then
   usage "args must be 1"
fi

route add default gw $GW
