# Fix for macos (see https://serverfault.com/questions/500764/dpkg-reconfigure-unable-to-re-open-stdin-no-file-or-directory)
grep -qxF 'export DEBIAN_FRONTEND=noninteractive' /home/vagrant/.bashrc || echo "export DEBIAN_FRONTEND=noninteractive" >> /home/vagrant/.bashrc
