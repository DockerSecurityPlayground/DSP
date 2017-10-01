FROM dsp/debian_base:latest


RUN apt-get install -y xinetd telnetd
RUN echo ' service telnet \n\
{\n\
        disable                 = no \n\
        socket_type             = stream\n\
        wait                    = no\n\
        user                    = root\n\
        server                  = /usr/sbin/in.telnetd\n\
        log_on_failure          += HOST\n\
}\n' \
>> /etc/xinetd.d/telnet
# Add User to find
# Start Telnet Server
CMD service xinetd start && bash
