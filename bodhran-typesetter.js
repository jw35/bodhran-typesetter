/* eslint  max-lines-per-function: ["warn", 250], no-console: "off" */

/*jslint browser: true */
/*jshint esversion: 6 */

/* exported BodhranTypesetter */

var BodhranTypesetter = (function() {

    document.addEventListener('DOMContentLoaded',  () => {
        var elements = document.getElementsByClassName('notation');
        for (var i = 0; i < elements.length; i++) {
            var notation = decodeHTMLEntities(elements[i].innerHTML);
            display_notation(elements[i], notation, 0.6);
        }
    });


    // Nasty global state...
    var ctx, xpos, symbol_offset, symbol_height, tones;


    function display_notation(element, notation, scale) {

        var lines = notation.split(/\r?\n/);

        // Test run to find the width and features used
        var test_canvas = document.createElement('canvas');
        ctx = test_canvas.getContext('2d');
        var max_width = 0;
        var superscripts = false;
        var subscripts = false;
        var n_lines = 0;
        tones = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].match(/^\s*$/)) {
                continue;
            }
            var flags = draw_notation(lines[i]);
            max_width = Math.max(max_width, flags.width);
            superscripts = superscripts || flags.uses_superscripts;
            subscripts = subscripts || flags.uses_subscripts;
            tones = tones || flags.uses_tones;
            n_lines += 1;
        }

        // Work out the row heights
        symbol_height = 60;
        var superscript_height = 0;
        var subscript_height = 0;
        var margin = 10;
        var gutter = 20;
        if (tones) {
            symbol_height += 50;
        }
        if (superscripts) {
            superscript_height = 30;
        }
        if (subscripts) {
            subscript_height = 30;
        }
        var row_height = (margin + subscript_height +
                          symbol_height +
                          superscript_height + margin);
        // Distance from top of row to the symbol line centre
        var centre_offset = (symbol_height/2 + superscript_height + margin);

        // Prepare the real canvas
        var canvas = document.createElement('canvas');
        canvas.height = ((row_height * n_lines) + (gutter * (n_lines-1))) * scale;
        canvas.width = (max_width + 10) * scale;

        ctx = canvas.getContext('2d');
        ctx.scale(scale, -scale);
        ctx.translate(0, -centre_offset);

        // Live run with the proper canvas
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].match(/^\s*$/)) {
                continue;
            }
            draw_notation(lines[j]);
            ctx.translate(0, -(row_height+gutter));
        }

        element.innerHTML = '';
        element.appendChild(canvas);

    }


    function draw_notation(line) {

        // A version for fillText that doesn't mirror
        ctx.fillTextDefault = function(text, x, y) {
            this.save();
            this.scale(1, -1);
            this.fillText(text, x, -y);
            this.restore();
        };

        // Work out the various vertical dimensions

        xpos = 10;
        symbol_offset = 0;

        /// Remove spaces and split into a list of chars
        var chars = line.replace(/\s/g, '').split('');
        var pos = 0;

        var uses_superscripts = false;
        var uses_subscripts = false;
        var uses_tones = false;
        var annotation = {};

        while (pos < chars.length) {

            // Capture annotation for the future
            if (chars[pos] === '"') {
                pos++;
                var which = 'sub';
                var str = '';
                if (chars[pos] === '_') {
                    pos++;
                }
                if (chars[pos] === '^') {
                    which = 'sup';
                    pos++;
                }

                while (pos < chars.length && chars[pos] !== '"') {
                    str += chars[pos];
                    pos++;
                }
                annotation[which] = str;
            }
            // Capture Hi/Mid/Low shifts
            else if (chars[pos] === '^') {
                symbol_offset = 25;
                uses_tones = true;
            }
            else if (chars[pos] === '=') {
                symbol_offset = 0;
            }

            else if (chars[pos] === '_') {
                symbol_offset = -25;
                uses_tones = true;
            }

            // Otherwise draw things
            else {

                var width = 0;

                // Down beat
                if (chars[pos] === 'd') {
                    width = arrow(false, false, false);
                }

                // Up beat
                else if (chars[pos] === 'u') {
                    width = arrow(true, false, false);
                }

                // Strong down beat
                else if (chars[pos] === 'D') {
                    width = arrow(false, true, false);
                }

                // Strong up beat
                else if (chars[pos] === 'U') {
                    width = arrow(true, true, false);
                }

                // Stab
                else if (chars[pos] === 's') {
                    width = stab(false, false);
                }

                // Strong stab
                else if (chars[pos] === 'S') {
                    width = stab(true, false);
                }

                // Dash
                else if (chars[pos] === '-') {
                    width = dash();
                }

                // Bar
                else if (chars[pos] === '|') {
                    width = bar();
                }

                // Double bar
                else if (chars[pos] === '!') {
                    width = double_bar();
                }

                // Thin-thick bar
                else if (chars[pos] === 'z' || chars[pos] === 'Z') {
                    width = end();
                }

                // Comma
                else if (chars[pos] === ',') {
                    width = comma();
                }

                // Triplet
                else if (chars[pos] === '+') {
                    width = triplet();
                    uses_superscripts = true;
                }

                // Half-width space
                else if (chars[pos] === '#') {
                    width = space();
                }

                // Half-width negative space
                else if (chars[pos] === 'b' || chars[pos] === 'B') {
                    width = negspace();
                }

                // Repeat
                else if (chars[pos] === 'x' || chars[pos] === 'X') {
                    pos++;
                    var count = '';
                    while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                        count += chars[pos];
                        pos ++;
                    }
                    width = repeat(count);
                    pos --;
                }

                // Time signature
                else if (chars[pos] === 't' || chars[pos] === 'T') {
                    var draw = chars[pos] === 'T';
                    pos++;
                    var b = '';
                    var m = '';
                    while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                        b += chars[pos];
                        pos ++;
                    }
                    pos++;
                    while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                        m += chars[pos];
                        pos ++;
                    }
                    width = tsig(b, m, draw);
                    pos --;
                }

                else {
                    console.log('Unrecognised character in encoding: ' + chars[pos]);
                }

                // Draw pending annotations
                if (annotation.sup !== undefined) {
                    sup(annotation.sup, width);
                    uses_superscripts = true;
                }
                if (annotation.sub !== undefined) {
                    sub(annotation.sub, width);
                    uses_subscripts = true;
                }
                annotation = {};

                // Move on drawing position
                xpos += width;

            }

            pos++;

        }

        return { width: xpos, uses_superscripts, uses_subscripts, uses_tones };

    }

    function arrow(rotate, wide, stroke) {

        ctx.save();
        // Character box is 80 wide, 60 high
        ctx.translate(xpos + 40, symbol_offset);

        if (rotate) {
            ctx.rotate(Math.PI);
        }

        var inner = 6;
        var outer = 16;
        if (wide) {
            inner = 10;
            outer = 26;
        }

        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(inner, 30);
        ctx.lineTo(inner, 0);
        ctx.lineTo(outer, 4);
        ctx.quadraticCurveTo(inner, -10, 0, -30);
        ctx.quadraticCurveTo(-inner, -10, -outer, 4);
        ctx.lineTo(-inner, 0);
        ctx.lineTo(-inner, 30);
        ctx.closePath();
        if (stroke) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.lineJoin = 'miter';
            ctx.stroke();
        }
        else {
            ctx.fillStyle = 'black';
            ctx.fill();
        }

        ctx.restore();

        staff_line(80);

        return 80;

    }

    function stab(wide, stroke) {

        ctx.save();
        ctx.translate(xpos + 40, symbol_offset);

        var delta = 16;
        if (wide) {
            delta = 26;
        }
        ctx.beginPath();
        ctx.moveTo(0, delta);
        ctx.quadraticCurveTo(delta/2-2, delta/2-2, delta, 0);
        ctx.quadraticCurveTo(delta/2-2, -delta/2+2, 0, -delta);
        ctx.quadraticCurveTo(-delta/2+2, -delta/2+2, -delta, 0);
        ctx.quadraticCurveTo(-delta/2+2, delta/2-2, 0, delta);
        ctx.closePath();
        if (stroke) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.lineJoin = 'miter';
            ctx.stroke();
        }
        else {
            ctx.fillStyle = 'black';
            ctx.fill();
        }

        ctx.restore();

        staff_line(80);

        return 80;

    }

    function dash() {

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(xpos + 20, 0);
        ctx.lineTo(xpos + 60, 0);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.lineCap = 'butt';
        ctx.stroke();

        ctx.restore();

        staff_line(80);

        return 80;

    }

    function bar() {

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(xpos + 15, 30);
        ctx.lineTo(xpos + 15, -30);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.lineCap = 'butt';
        ctx.stroke();

        ctx.restore();

        staff_line(30);

        return 30;

    }

    function double_bar() {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineCap = 'butt';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(xpos + 15, 30);
        ctx.lineTo(xpos + 15, -30);

        ctx.moveTo(xpos + 25, 30);
        ctx.lineTo(xpos + 25, -30);
        ctx.stroke();

        ctx.restore();

        staff_line(40);

        return 40;

    }

    function end() {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineCap = 'butt';

        ctx.beginPath();
        ctx.moveTo(xpos + 15, 30);
        ctx.lineTo(xpos + 15, -30);
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xpos + 25, 30);
        ctx.lineTo(xpos + 25, -30);
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.restore();

        staff_line(40);

        return 40;

    }

    function sub(text, symbol_width) {

        ctx.save();

        ctx.font = 'italic 20pt Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillTextDefault(text, xpos + symbol_width/2, -symbol_height/2 - 8);

        ctx.restore();

        return 0;

    }

    function sup(text, symbol_width) {

        ctx.save();

        ctx.font = 'italic 20pt Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillTextDefault(text, xpos + symbol_width/2, symbol_height/2 + 2);

        ctx.restore();

        return 0;

    }

    function comma() {

        ctx.save();

        ctx.font = 'bold italic 30pt Arial';
        ctx.textAlign = 'center';
        ctx.fillTextDefault(',', xpos+10, -symbol_height/2);

        ctx.restore();

        staff_line(20);

        return 20;

    }

    function triplet() {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.font = 'bold italic 20pt Arial';
        ctx.textAlign = 'center';

        var height = symbol_height/2 + 10;


        ctx.fillTextDefault('T', xpos, height);

        ctx.beginPath();
        ctx.moveTo(xpos - 7, height+8);
        ctx.quadraticCurveTo(xpos - 37, height+8, xpos - 40, height);
        ctx.moveTo(xpos + 7, height+8);
        ctx.quadraticCurveTo(xpos + 37, height+8, xpos + 40, height);
        ctx.stroke();

        ctx.restore();

        return 0;

    }

    function space(howmuch) {

        var dist = (howmuch ? howmuch : 40);

        staff_line(dist);
        return dist;

    }

    function negspace(howmuch) {

        var dist = (howmuch ? howmuch : 40);

        return -dist;

    }

    function tsig(beats, measure, draw) {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.font = 'bold 35pt Times';
        ctx.textAlign = 'center';

        // Widest of '12' and actual beats and measure to promote
        // consistent alignment
        var width = Math.max(
            ctx.measureText('12').width,
            ctx.measureText(beats).width,
            ctx.measureText(measure).width);

        if (draw) {
            ctx.textBaseline = 'alphabetic';
            ctx.fillTextDefault(beats, xpos + 10 + (width/2), 0);
            ctx.textBaseline = 'top';
            ctx.fillTextDefault(measure, xpos + 10 + (width/2), 0);
        }

        ctx.restore();

        return width + 25;

    }


    function repeat(times) {

        if (!times) {
            times = 2;
        }

        var width = 0;

        // A repeat of less than two makes no sense
        if (times >= 2) {

            ctx.save();

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.lineCap = 'butt';

            ctx.beginPath();
            ctx.arc(xpos + 10, 10, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xpos + 10, -10, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(xpos + 20, -30);
            ctx.lineTo(xpos + 20, 30);
            ctx.moveTo(xpos + 30, -30);
            ctx.lineTo(xpos + 30, 30);
            ctx.stroke();

            width = 40;

            staff_line(40);

            if (times > 2) {
                ctx.font = '24pt Arial';
                ctx.textAlign = 'start';
                ctx.textBaseline = 'middle';
                var label = '\u00d7' + times;
                ctx.fillTextDefault('\u00d7' + times, xpos + 45, 0);
                width += ctx.measureText(label).width + 10;
            }

            ctx.restore();

        }

        return width;

    }

    function staff_line(width) {

        if (tones) {
            ctx.beginPath();
            ctx.moveTo(xpos, 0);
            ctx.lineTo(xpos+width, 0);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

    }

    function decodeHTMLEntities(text) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    return {display_notation: display_notation};

}());
