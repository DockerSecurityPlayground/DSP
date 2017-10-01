FROM dsp/debian_base:latest 

RUN apt-get update && apt-get install -y vsftpd xinetd ftp && \
sed -i s/listen=YES/listen=NO/g /etc/vsftpd.conf && \
sed -i s/listen_ipv6=YES/#listen_ipv6=YES/g /etc/vsftpd.conf && \
#sed -i s/anonymous_enable=NO/anonymous_enable=YES/g /etc/vsftpd.conf && \
mkdir -p /var/run/vsftpd/empty 
RUN echo ' service ftp \n\
{\n\
        disable                 = no \n\
        socket_type             = stream\n\
        wait                    = no\n\
        user                    = root\n\
        server                  = /usr/sbin/vsftpd\n\
        per_source              = 5\n\
        instances               = 200\n\
       banner_fail             = /etc/vsftpd.busy\n\
        log_on_success          += PID HOST DURATION\n\
        log_on_failure          += HOST\n\
}\n' \
  >> /etc/xinetd.conf
CMD service xinetd start && bash
