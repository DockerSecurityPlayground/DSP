FROM linode/lamp

RUN apt-get update && apt-get install -y php5-mysql vim gcc make
COPY mysql_start.sh /mysql_start.sh
COPY apache_start.sh /apache_start.sh
COPY create_db.sh /create_db.sh
COPY sql_to_db.sh /sql_to_db.sh
RUN chmod +x /mysql_start.sh ;
RUN chmod +x /apache_start.sh ;
RUN chmod +x /create_db.sh ;
RUN chmod +x /sql_to_db.sh ;
LABEL ports="80" \
      actions.start_apache.command="/apache_start.sh" \ 
      actions.start_apache.description="Start web server" \ 
      actions.start_mysql.command="/mysql_start.sh" \ 
      actions.start_mysql.description="Start sql server" \ 

      actions.create_db.command="/create_db.sh" \ 
      actions.create_db.description="Create a new db, insert a name for new db" \ 
      actions.create_db.args.db_name.val="" \ 
      actions.create_db.args.db_name.type="text" \ 

      actions.sql_to_db.command="/sql_to_db.sh" \ 
      actions.sql_to_db.description="Execute a sql file into a db (you must load a sql file in container first! ) " \ 
      actions.sql_to_db.args.db_name.val="" \ 
      actions.sql_to_db.args.db_name.type="text" \ 
      actions.sql_to_db.args.sql_file.val="" \ 
      actions.sql_to_db.args.sql_file.type="text" \ 
