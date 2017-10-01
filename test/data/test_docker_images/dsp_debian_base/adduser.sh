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
echo "Usage adduser.sh [--name=val] [ --password=val]"
exit 1
}

Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --name=*)
      NAME=${ARG#*=} 
      ;;
    --password=*)
      PASSWORD=${ARG#*=} 
      ;;
    *)
      usage "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 2 ]; then
   usage "args must be 2"
fi


useradd $NAME
echo -e "$PASSWORD\n$PASSWORD" | passwd $NAME
mkhomedir_helper $NAME

