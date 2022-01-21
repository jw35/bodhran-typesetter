/* eslint  max-lines-per-function: ["warn", 700], no-console: "off" */

/*jslint browser: true */
/*jshint esversion: 6 */

/* exported BodhranTypesetter */

var BodhranTypesetter = (function() {

    var SYMBOL_HEIGHT = 60;           // Basic height of a symbol
    var SUPERSCRIPT_HEIGHT = 30;      // Extra height needed for superscript or triplet
    var SUBSCRIPT_HEIGHT = 30;        // Extra depth needed for a subscript
    var TONE_HEIGHT = 25;             // extra height/depth needed by hi/lo tomes
    var TSIG_HEIGHT = 14;             // Extra height/depth needed for tsigs
    var GUTTER_HEIGHT = 20;           // Space between consecutive lines

    var scale_factor = 0.5;

    document.addEventListener('DOMContentLoaded',  () => {
        var elements = document.getElementsByClassName('notation');
        for (var i = 0; i < elements.length; i++) {
            var notation = decodeHTMLEntities(elements[i].innerHTML);
            display_notation(elements[i], notation, BodhranTypesetter.scale_factor);
        }
    });


    function display_notation(element, notation, scale) {

        // Extract non-blank lines of nototion
        var lines = notation.split(/\r?\n/).filter(line => !line.match(/^\s*$/));

        if (lines.length < 1) {
            console.log('Empty notation - skipping: ' + notation);
        }
        else {

            // Get the width, height and depth metrics for every line
            var metrics = analyse(lines);

            // Find maximum line height (max(up) + max(down) + gutter)
            var line_height = metrics.map(m => m.up).reduce((a, b) => Math.max(a, b)) +
                              metrics.map(m => m.down).reduce((a, b) => Math.max(a, b)) +
                              GUTTER_HEIGHT;

            // Canvas height = line[1] 'up' + n-1 line height + line[n] down
            var height = metrics[0].up + (line_height * (lines.length-1)) + metrics[metrics.length-1].down;
            // Canvas width = maximum line widht
            var width = metrics.map(m => m.width).reduce((a, b) => Math.max(a, b));

            // Does this notation use tones?
            var uses_tones = (metrics.map(m => m.hitones).indexOf(true) !== -1) ||
                             (metrics.map(m => m.lotones).indexOf(true) !== -1);

            // Prepare the real canvas

            var canvas = document.createElement('canvas');
            canvas.classList.add('diagram');
            canvas.height = height * scale;
            canvas.width = width * scale;

            var ctx = canvas.getContext('2d');
            ctx.scale(scale, -scale);

            // Move to first baseline
            ctx.translate(0, -metrics[0].up);

            // Live run with the proper canvas
            for (var i = 0; i < lines.length; i++) {
                draw_one_line(ctx, lines[i], uses_tones, metrics[i].hitones, metrics[i].lotones);
                ctx.translate(0, -line_height);
            }

            element.innerHTML = '';
            element.appendChild(canvas);

        }
    }


    function analyse(lines) {

        var test_canvas = document.createElement('canvas');
        var ctx = test_canvas.getContext('2d');

        var metrics = [];

        for (var i = 0; i < lines.length; i++) {

            var flags = draw_one_line(ctx, lines[i]);

            var up = SYMBOL_HEIGHT/2;
            var down = SYMBOL_HEIGHT/2;
            var hitones = false;
            var lotones = false;
            if (flags.superscripts) {
                up += SUPERSCRIPT_HEIGHT;
            }
            if (flags.hitones) {
                up += TONE_HEIGHT;
                hitones = true;
            }
            if (flags.subscripts) {
                down += SUBSCRIPT_HEIGHT;
            }
            if (flags.lotones) {
                down += TONE_HEIGHT;
                lotones = true;
            }
            if (flags.tsigs) {
                up = Math.max(up, SYMBOL_HEIGHT/2 + TSIG_HEIGHT/2);
                down = Math.max(down, SYMBOL_HEIGHT/2 + TSIG_HEIGHT/2);
            }
            metrics.push({width: flags.width, up, down, hitones, lotones});
        }

        return metrics;

    }


    function draw_one_line(ctx, line, uses_tones, uses_hitones, uses_lotones) {

        // A version for fillText that doesn't mirror
        ctx.fillTextDefault = function(text, x, y) {
            this.save();
            this.scale(1, -1);
            this.fillText(text, x, -y);
            this.restore();
        };

        var superscripts = false;
        var subscripts = false;
        var hitones = false;
        var lotones = false;
        var tsigs = false;

        var xpos = 0;
        var symbol_offset = 0;
        var annotation = {};

        /// Remove spaces and split into a list of chars
        var chars = line.replace(/\s/g, '').split('');
        var pos = 0;

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
                symbol_offset = TONE_HEIGHT;
                hitones = true;
            }
            else if (chars[pos] === '=') {
                symbol_offset = 0;
            }

            else if (chars[pos] === '_') {
                symbol_offset = -TONE_HEIGHT;
                lotones = true;
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
                    superscripts = true;
                }

                // Space
                else if (chars[pos] === '#') {
                    pos++;
                    var denom = '';
                    while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                        denom += chars[pos];
                        pos ++;
                    }
                    width = space(denom);
                    pos --;
                }

                // Negative space
                else if (chars[pos] === 'b' || chars[pos] === 'B') {
                    pos++;
                    var denom = '';
                    while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                        denom += chars[pos];
                        pos ++;
                    }
                    width = negspace(denom);
                    pos --;
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

                // Start of repeat block
                else if (chars[pos] === ':') {
                    width = repeat_start();
                }

                // Time signature
                else if (chars[pos] === 't' || chars[pos] === 'T') {
                    var draw_tsig = chars[pos] === 'T';
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
                    width = tsig(b, m, draw_tsig);
                    tsigs = true;
                    pos --;
                }

                else {
                    console.log('Unrecognised character in encoding: ' + chars[pos]);
                }

                // Draw pending annotations
                if (annotation.sup !== undefined) {
                    sup(annotation.sup, width);
                    superscripts = true;
                }
                if (annotation.sub !== undefined) {
                    sub(annotation.sub, width);
                    subscripts = true;
                }
                annotation = {};

                // Move on drawing position
                xpos += width;

            }

            pos++;

        }

        return { width: xpos, superscripts, subscripts, hitones, lotones, tsigs };

        // Support functions for draw_one_line() -----------------------------

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
            // Character box is 80 wide, 60 high
            ctx.translate(xpos + 40, symbol_offset);

            var delta = 16;
            if (wide) {
                delta = 23;
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

            // Character box is 80 wide
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
            ctx.moveTo(xpos + 20, 30);
            ctx.lineTo(xpos + 20, -30);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.lineCap = 'butt';
            ctx.stroke();

            ctx.restore();

            staff_line(40);

            return 40;

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


        function repeat_start() {

            ctx.save();

            ctx.strokeStyle = 'black';
            ctx.lineCap = 'butt';

            ctx.beginPath();
            ctx.lineWidth = 6;
            ctx.moveTo(xpos + 15, -30);
            ctx.lineTo(xpos + 15, 30);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(xpos + 25, -30);
            ctx.lineTo(xpos + 25, 30);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(xpos + 35, 10, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xpos + 35, -10, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();

            staff_line(40);

            return 40;

        }


        function repeat(times) {

            if (!times) {
                times = 2;
            }

            var symbol_width = 0;

            // A repeat of less than two makes no sense
            if (times >= 2) {

                ctx.save();

                ctx.strokeStyle = 'black';
                ctx.lineCap = 'butt';

                ctx.beginPath();
                ctx.arc(xpos + 5, 10, 3, 0, Math.PI*2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(xpos + 5, -10, 3, 0, Math.PI*2);
                ctx.fill();

                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.moveTo(xpos + 15, -30);
                ctx.lineTo(xpos + 15, 30);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = 6;
                ctx.moveTo(xpos + 25, -30);
                ctx.lineTo(xpos + 25, 30);
                ctx.stroke();

                symbol_width = 40;

                staff_line(40);

                if (times > 2) {
                    ctx.font = '24pt sans-serif';
                    ctx.textAlign = 'start';
                    ctx.textBaseline = 'middle';
                    var label = '\u00d7' + times;
                    ctx.fillTextDefault('\u00d7' + times, xpos + 45, 0);
                    symbol_width += ctx.measureText(label).width + 10;
                }

                ctx.restore();

            }

            return symbol_width;

        }


        function sup(text, symbol_width) {

            ctx.save();

            var offset = SYMBOL_HEIGHT/2 + 2;
            if (uses_hitones) {
                offset += TONE_HEIGHT;
            }

            ctx.font = 'italic 20pt sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillTextDefault(text, xpos + symbol_width/2, offset);

            ctx.restore();

            return 0;

        }

        function sub(text, symbol_width) {

            ctx.save();

            var offset = -SYMBOL_HEIGHT/2 - 4;
            if (uses_lotones) {
                offset -= TONE_HEIGHT;
            }

            ctx.font = 'italic 20pt sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillTextDefault(text, xpos + symbol_width/2, offset);

            ctx.restore();

            return 0;

        }

        function comma() {

            ctx.save();

            ctx.font = 'bold italic 30pt sans-serif';
            ctx.textAlign = 'center';
            ctx.fillTextDefault(',', xpos+10, -SYMBOL_HEIGHT/2+6);

            ctx.restore();

            staff_line(20);

            return 20;

        }

        function triplet() {

            ctx.save();

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineCap = 'butt';
            ctx.font = 'bold italic 20pt sans-serif';
            ctx.textAlign = 'center';

            var height = SYMBOL_HEIGHT/2 + 8;
            if (uses_hitones) {
                height += TONE_HEIGHT;
            }

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

        function space(denom) {

            var dist = 80 / (denom ? denom : 2);

            staff_line(dist);
            return dist;

        }

        function negspace(denom) {

            var dist = 80 / (denom ? denom : 2);

            return -dist;

        }

        function tsig(beats, measure, draw) {

            ctx.save();

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineCap = 'butt';
            ctx.font = 'bold 35pt serif';
            ctx.textAlign = 'center';

            // Widest of '12' and actual beats and measure to promote
            // consistent alignment
            var semi_width = Math.max(
                ctx.measureText('12').width,
                ctx.measureText(beats).width,
                ctx.measureText(measure).width)/2;

            if (draw) {
                ctx.textBaseline = 'alphabetic';
                ctx.fillTextDefault(beats, xpos + (semi_width), 2);
                ctx.textBaseline = 'top';
                ctx.fillTextDefault(measure, xpos + (semi_width), 2);
            }

            ctx.restore();

            return (2 * semi_width) + 10;

        }

        function staff_line(line_width) {

            if (uses_tones) {
                ctx.beginPath();
                ctx.moveTo(xpos, 0);
                ctx.lineTo(xpos+line_width, 0);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

        }

        // END support functions for draw_one_line() -------------------------

    }


    function decodeHTMLEntities(text) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    return {display_notation, scale_factor};

}());
