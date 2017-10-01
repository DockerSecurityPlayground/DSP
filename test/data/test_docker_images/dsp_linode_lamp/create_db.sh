#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        create_db.sh  [--db_name=db_name]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage create_db.sh [--db_name=val] "
exit 1
}

Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --db_name=*)
      DB_NAME=${ARG#*=} 
      ;;
    *)
      usage "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 1 ]; then
   usage "args must be 1"
fi
mysql -u root -pAdmin2015 -e "create database ${DB_NAME}"
