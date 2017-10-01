#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        adduser.sh [--name=val] [ --password=val]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage adduser.sh [--username=val] [ --ctf=val]"
exit 1
}

Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --username=*)
      NAME=${ARG#*=} 
      ;;
    --ctf=*)
      CTF=${ARG#*=} 
      ;;
    *)
      usage "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 2 ]; then
   usage "args must be 2"
fi


echo $CTF > /home/$NAME/secret
