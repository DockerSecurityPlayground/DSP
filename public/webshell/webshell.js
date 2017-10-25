var term;
var socket = io(location.origin, {path: '/webshell/socket.io'})
var buf = '';

function Webshell(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}

Webshell.prototype.run = function() {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
}

Webshell.prototype.sendString_ = function(str) {
    socket.emit('input', str);
};

Webshell.prototype.onTerminalResize = function(col, row) {
    socket.emit('resize', { col: col, row: row });
};

socket.on('connect', function() {
    lib.init(function() {
        hterm.defaultStorage = new lib.Storage.Local();
        term = new hterm.Terminal();
        window.term = term;
        term.decorate(document.getElementById('terminal'));

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.prefs_.set('ctrl-c-copy', true);
        term.prefs_.set('ctrl-v-paste', true);
        term.prefs_.set('use-default-window-copy', true);

        term.runCommandClass(Webshell, document.location.hash.substr(1));
        socket.emit('resize', {
            col: term.screenSize.width,
            row: term.screenSize.height
        });

        if (buf && buf != '')
        {
            term.io.writeUTF16(buf);
            buf = '';
        }
    });
});

socket.on('output', function(data) {
    if (!term) {
        buf += data;
        return;
    }
    term.io.writeUTF16(data);
});

socket.on('exit', function(redirectPath) {
  console.log("Logout!");
  location.href = redirectPath;
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
});
