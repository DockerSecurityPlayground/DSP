#!/bin/bash
# Author:       giper
# Email:        g.per45@gmail.com
# Date:        	 
# Usage:        sql_to_db.sh  [--db_name=db_name]
# Description:
# 
#
#


usage() {
echo $1
echo "Usage sql_to_db.sh [--db_name=val, --sql_file=val] "
exit 1
}

Arguments=( "$@" ) 
# Parse Parameters #
for ARG in "${Arguments[@]}"; do
  case $ARG in
    --db_name=*)
      DB_NAME=${ARG#*=} 
      ;;
    --sql_file=*)
      SQL_FILE=${ARG#*=} 
      ;;
    *)
      usage "Unknown Argument $ARG" ;;
  esac
done

if [ $# -ne 2 ]; then
   usage "args must be 2"
fi

#Operation
mysql -u root -pAdmin2015  $DB_NAME < $SQL_FILE
