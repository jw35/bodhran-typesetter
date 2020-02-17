/* eslint  max-lines-per-function: ["warn", 250], no-console: "off" */

/*jslint browser: true */
/*jshint esversion: 6 */

/* exported BodhranTypesetter */

var BodhranTypesetter = (function() {

    document.addEventListener('DOMContentLoaded',  () => {
        var elements = document.getElementsByTagName('canvas');
        for(var i = 0; i < elements.length; i++) {
            if (elements[i].classList.contains('notation')) {
                var notation = decodeHTMLEntities(elements[i].innerHTML);
                display_notation(elements[i], notation, 0.6);
            }
        }
    });


    function display_notation(canvas, notation, scale) {

        // Test run to find the width
        var test_canvas = document.createElement('canvas');
        var flags = draw_notation(test_canvas, notation, scale, {});

        // Live run with the right width
        canvas.width = flags['width'] + 10;
        draw_notation(canvas, notation, scale, flags);

    }


    // NAsty global state...
    var ctx, xpos, symbol_offset, symbol_height, analysis, tones;


    function draw_notation(canvas, notation, scale, flags) {

        analysis = {};

        if (canvas.getContext) {
            ctx = canvas.getContext('2d');

            // A version for fillText that doesn't mirror
            ctx.fillTextDefault = function(text, x, y) {
                this.save();
                this.scale(1, -1);
                this.fillText(text, x, -y);
                this.restore();
            };

            // Work out the various vertical dimensions
            symbol_height = 60;
            tones = flags.tones;
            var superscript_height = 0;
            var subscript_height = 0;
            var margin = 10;

            if (flags.tones) {
                symbol_height += 50;
            }
            if (flags.superscripts) {
                superscript_height = 25;
            }
            if (flags.subscripts) {
                subscript_height = 25;
            }

            // Setup the canvas with +ve y-axis up and y=0 in the centre of
            // the symbol row
            var canvas_height = (margin + subscript_height +
                                 symbol_height +
                                 superscript_height + margin) * scale;
            // Distance from top of canvas to the symbol line centre
            var centre_offset = (symbol_height/2 + superscript_height + 10) * scale;

            canvas.height = canvas_height;
            ctx.translate(0, centre_offset);
            ctx.scale(scale, -scale);

            xpos = 10;
            symbol_offset = 0;
            var annotation = {};

            /// Remove spaces and split into a list of chars
            var chars = notation.replace(/\s/g, '').split('');
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
                    symbol_offset = 25;
                    analysis['tones'] = true;
                }
                else if (chars[pos] === '=') {
                    symbol_offset = 0;
                }

                else if (chars[pos] === '_') {
                    symbol_offset = -25;
                    analysis['tones'] = true;
                }

                // Otherwise draw things
                else {

                    var width = 0;

                    if (chars[pos] === 'd') {
                        width = arrow(false, false, false);
                    }

                    else if (chars[pos] === 'u') {
                        width = arrow(true, false, false);
                    }

                    else if (chars[pos] === 'D') {
                        width = arrow(false, true, false);
                    }

                    else if (chars[pos] === 'U') {
                        width = arrow(true, true, false);
                    }

                    else if (chars[pos] === 's') {
                        width = stab(false, false);
                    }

                    else if (chars[pos] === 'S') {
                        width = stab(true, false);
                    }

                    else if (chars[pos] === '-') {
                        width = dash();
                    }

                    else if (chars[pos] === '|') {
                        width = bar();
                    }

                    else if (chars[pos] === '!') {
                        width = double_bar();
                    }

                    else if (chars[pos] === 'z' || chars[pos] === 'Z') {
                        width = end();
                    }

                    else if (chars[pos] === ',') {
                        width = comma();
                    }

                    else if (chars[pos] === '+') {
                        width = triplet();
                    }

                    else if (chars[pos] === '#') {
                        width = space();
                    }

                    else if (chars[pos] === 'b' || chars[pos] === 'B') {
                        width = negspace();
                    }

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
                    }
                    if (annotation.sub !== undefined) {
                        sub(annotation.sub, width);
                    }
                    annotation = {};

                    // Move on drawing position
                    xpos += width;

                }

                pos++;

            }

            analysis['width'] = xpos * scale;

            return analysis;

        }

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

        analysis['subscripts'] = true;

        return 0;

    }

    function sup(text, symbol_width) {

        ctx.save();

        ctx.font = 'italic 20pt Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillTextDefault(text, xpos + symbol_width/2, symbol_height/2 + 2);

        ctx.restore();

        analysis['superscripts'] = true;

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

        ctx.fillTextDefault('T', xpos, symbol_height/2);

        ctx.beginPath();
        ctx.moveTo(xpos - 7, (symbol_height/2)+8);
        ctx.quadraticCurveTo(xpos - 37, (symbol_height/2)+8, xpos - 40, (symbol_height/2));
        ctx.moveTo(xpos + 7, (symbol_height/2)+8);
        ctx.quadraticCurveTo(xpos + 37, (symbol_height/2)+8, xpos + 40, (symbol_height/2));
        ctx.stroke();

        ctx.restore();

        analysis['superscripts'] = true;

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
