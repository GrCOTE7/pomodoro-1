function update_progress_func(username, length) {
    "use strict";
    return function (periods) {
        var remaining = periods[5] * 60 + periods[6],
            perc = 100 - (remaining / length) * 100;
        $("#progress").progressbar("value", perc);
    };
}

function reset() {
    "use strict";
    $('#timer').countdown('destroy');
    $('#uptimer').countdown('destroy');
    $("#progress").progressbar("value", 0);
    $("#progress").progressbar("disable");
}

function ring() {
    "use strict";
    $("#player").jPlayer("play");
}

function server_time() {
    "use strict";
    var time = null;
    $.ajax({
        url: 'time.php',
        async: false,
        dataType: 'text',
        success: function (text) {
            time = new Date(text);
        },
        error: function () {
            time = new Date();
        }
    });
    return time;
}

function pomodoro_timer(begin, length) {
    "use strict";
    reset();
    $("#progress").progressbar("enable");
    $('#content').css('background-color', '#F20000');
    $('#stop').button('enable');
    $('#start').button('disable');
    var until = new Date((begin + length) * 1000);
    $('#timer').countdown({
        alwaysExpire: true,
        until: until,
        format: 'MS',
        compact: true,
        serverSync: server_time,
        onTick: update_progress_func(username, length),
        onExpiry: pomodoro_finished
    });
}

function idle_timer() {
    "use strict";
    reset();
    $('#content').css('background-color', '#C0C0C0');
    $('#stop').button('disable');
    $('#start').button("enable");
    $('#timer').html("IDLE");
}

function break_timer(begin, length) {
    "use strict";
    reset();
    $("#progress").progressbar("enable");
    $('#content').css('background-color', '#336600');
    $('#stop').button('enable');
    $('#start').button('disable');
    var until = new Date((begin + length) * 1000);
    $('#timer').countdown({
        until: until,
        format: 'MS',
        compact: true,
        serverSync: server_time,
        onTick: update_progress_func(username, length),
        onExpiry: break_finished
    });
}

function refresh(data) {
    "use strict";
    var error, status = data.error;
    if (!error) {
        status = data.status;
        switch (status) {
        case "IDLE":
            idle_timer(new Date(data.begin * 1000));
            break;
        case "S_BREAK":
        case "L_BREAK":
            break_timer(data.begin, data.length);
            break;
        case "POMODORO":
            pomodoro_timer(data.begin, data.length);
            break;
        }
    }
}

function status() {
    "use strict";
    $.getJSON('api.php', {
        u: username,
        c: "status"
    }, refresh);
}

function start() {
    "use strict";
    $.getJSON('api.php', {
        u: username,
        c: "start"
    }, refresh);
}

function stop() {
    "use strict";
    $.getJSON('api.php', {
        u: username,
        c: "stop"
    }, refresh);
}

function give_break() {
    "use strict";
    $.getJSON('api.php', {
        u: username,
        c: "break"
    }, refresh);
}

function dialog() {
    "use strict";
    var dialog_rv = "TAKE_A_BREAK";
    $("#dialog-confirm").dialog({
        title: "Pomodoro Finished",
        resizable: false,
        closeOnEscape: false,
        height: 140,
        width: 440,
        modal: true,
        close: function () {
            switch (dialog_rv) {
            case "TAKE_A_BREAK":
                give_break();
                break;
            case "SKIP_BREAK":
                start();
                break;
            case "VOID":
                stop();
                break;
            }
        },
        buttons: {
            "Take a Break": function () {
                dialog_rv = "TAKE_A_BREAK";
                $(this).dialog("close");
            },
            "Skip Break": function () {
                dialog_rv = "SKIP_BREAK";
                $(this).dialog("close");
            },
            "Void": function () {
                dialog_rv = "VOID";
                $(this).dialog("close");
            }
        }
    });
}

function pomodoro_finished() {
    "use strict";
    ring();
    dialog();
}

function break_finished() {
    "use strict";
    ring();
    stop();
}

$("#progress").progressbar();
$("#start").button();
$("#stop").button();

$("#player").jPlayer({
    ready: function () {
        $(this).jPlayer("setMedia", {
            mp3: "http://pomodoro.iletken.com.tr/media/TaDa.mp3",
            oga: "http://pomodoro.iletken.com.tr/media/TaDa.ogg"
        });
        status();
    },
    supplied: "m4v, oga",
    size: {
        width: "0px",
        height: "0px"
    }
});
