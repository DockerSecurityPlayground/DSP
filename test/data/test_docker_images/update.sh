update_image() {
cd $1; docker build -t $2 . 
cd ..
}
update_image dsp_debian_base dsp/debian_base 
update_image dsp_debian_bot dsp/debian_bot
update_image dsp_telnet_server dsp/telnet_server
update_image dsp_ftp_server/ dsp/ftp_server
update_image dsp_shellinabox dsp/shellinabox
update_image dsp_linode_lamp/ dsp/linode_lamp

