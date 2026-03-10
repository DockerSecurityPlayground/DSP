/** xterm.js WebShell client for DSP container terminal */
var term;
var socket = io(location.origin, {path: '/webshell/socket.io'})
var fitAddon;
var buf = '';

socket.on('connect', function() {
    // Create xterm.js terminal
    term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 14,
        fontFamily: '"Courier New", monospace',
        theme: {
            background: '#000000',
            foreground: '#00ff00',
            cursor: '#00ff00',
            cursorAccent: '#000000'
        },
        scrollback: 1000,
        allowTransparency: false,
        rows: 24,
        cols: 80
    });

    // Attach to DOM
    term.open(document.getElementById('terminal'));

    // Initialize FitAddon for auto-sizing
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    
    // Fit terminal to container
    try {
        fitAddon.fit();
    } catch (e) {
        console.warn('FitAddon fit failed:', e);
    }

    // Handle input from user
    term.onData(function(data) {
        socket.emit('input', data);
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        try {
            fitAddon.fit();
            socket.emit('resize', {
                col: term.cols,
                row: term.rows
            });
        } catch (e) {
            console.warn('Resize failed:', e);
        }
    });

    // Send initial size
    socket.emit('resize', {
        col: term.cols,
        row: term.rows
    });

    // Write any buffered data
    if (buf && buf !== '') {
        term.write(buf);
        buf = '';
    }
});

socket.on('output', function(data) {
    if (!term) {
        buf += data;
        return;
    }
    try {
        term.write(data);
    } catch (e) {
        console.error('Terminal write error:', e);
    }
});

socket.on('exit', function(redirectPath) {
    var isEmbedMode = !!window.DSP_EMBED_MODE;
    if (isEmbedMode) {
        if (term) {
            term.write('\r\n\r\n[Shell closed]\r\n');
        }
        return;
    }
    console.log("Logout!");
    if (redirectPath) {
        location.href = redirectPath;
    }
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
    if (term) {
        term.write('\r\n[Disconnected from server]\r\n');
    }
});

socket.on('error', function(error) {
    console.error('Socket error:', error);
    if (term) {
        term.write('\r\n[Socket error: ' + error + ']\r\n');
    }
});
