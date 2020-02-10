/* eslint max-lines-per-function: ["warn", 1000] */

/*jslint browser: true */
/*jshint esversion: 6 */
/*global  */

/* exported init */

document.addEventListener('DOMContentLoaded',  (event) => {
    var elements = document.getElementsByTagName('canvas');
    for(var i = 0; i < elements.length; i++) {
        if (elements[i].classList.contains('notation')) {
            var notation = elements[i].innerHTML;
            draw_notation(elements[i], notation);
        }
    }
});


function draw_notation(canvas, notation) {

    var xpos = 10;
    var ypos = 0;

    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');

        ctx.translate(0, 90);

        /// Remove spaces and split into a list of chars
        var chars = notation.replace(/ /g, '').split('');
        var pos = 0;

        while (pos < chars.length) {

            if (chars[pos] === 'd') {
                arrow(false, false, false);
            }

            else if (chars[pos] === 'u') {
                arrow(true, false, false);
            }

            else if (chars[pos] === 'D') {
                arrow(false, true, false);
            }

            else if (chars[pos] === 'U') {
                arrow(true, true, false);
            }

            else if (chars[pos] === 's') {
                stab(false, false);
            }

            else if (chars[pos] === 'S') {
                stab(true, false);
            }

            else if (chars[pos] === '-') {
                dash();
            }

            else if (chars[pos] === '|') {
                bar();
            }

            else if (chars[pos] === 'Z') {
                end();
            }

            else if (chars[pos] === ',') {
                comma();
            }

            else if (chars[pos] === '&') {
                triplet();
            }

            else if (chars[pos] === '+') {
                space();
            }

            else if (chars[pos] === '#') {
                negspace();
            }

            else if (chars[pos] === '^') {
                high();
            }

            else if (chars[pos] === '=') {
                mid();
            }

            else if (chars[pos] === '_') {
                low();
            }

            else if (chars[pos] === '"') {
                pos++;
                var fn = sub;
                var str = '';
                if (chars[pos] === '^') {
                    fn = sup;
                    pos++;
                }
                else if (chars[pos] === '_') {
                    fn = sub;
                    pos++;
                }

                while (pos < chars.length && chars[pos] !== '"') {

                    str += chars[pos];
                    pos++;
                }
                fn(str);
            }

            else if (chars[pos] === 'x' || chars[pos] === 'X') {
                pos++;
                var count = '';
                while (pos < chars.length && chars[pos] >= '0' && chars[pos] <= '9') {
                    count += chars[pos];
                    pos ++;
                }
                repeat(count);
                pos --;
            }

            else if (chars[pos] === 't' || chars[pos] === 'T') {
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
                tsig(b, m);
                pos --;
            }

            else {
                console.log('Unrecognised character in encoding: ' + chars[pos]);
            }
            pos++;

        }

    }

    function arrow(rotate, wide, stroke) {

        ctx.save();
        // Character box is 60 wide, 60 high
        ctx.translate(xpos + 30, ypos - 30);

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
        ctx.moveTo(0, -24);
        ctx.lineTo(inner, -30);
        ctx.lineTo(inner, 0);
        ctx.lineTo(outer, -4);
        ctx.quadraticCurveTo(inner, 10, 0, 30);
        ctx.quadraticCurveTo(-inner, 10, -outer, -4);
        ctx.lineTo(-inner, 0);
        ctx.lineTo(-inner, -30);
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

        xpos += 60;

    }

    function stab(wide, stroke) {

        ctx.save();
        ctx.translate(xpos + 30, ypos - 30);

        var delta = 16;
        if (wide) {
            delta = 26;
        }
        ctx.beginPath();
        ctx.moveTo(0, -delta);
        //ctx.moveTo(delta, 0)
        ctx.quadraticCurveTo(delta/2-2, -delta/2+2, delta, 0);
        ctx.quadraticCurveTo(delta/2-2, delta/2-2, 0, delta);
        ctx.quadraticCurveTo(-delta/2+2, delta/2-2, -delta, 0);
        ctx.quadraticCurveTo(-delta/2+2, -delta/2+2, 0, -delta);
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

        xpos += 60;

    }

    function dash() {

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(xpos + 15, -30);
        ctx.lineTo(xpos + 45, -30);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.lineCap = 'butt';
        ctx.stroke();

        ctx.restore();

        xpos += 60;

    }

    function bar() {

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(xpos + 10, 0);
        ctx.lineTo(xpos + 10, -60);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.lineCap = 'butt';
        ctx.stroke();

        ctx.restore();

        xpos += 20;

    }

    function end() {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineCap = 'butt';

        ctx.beginPath();
        ctx.moveTo(xpos + 10, 0);
        ctx.lineTo(xpos + 10, -60);
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xpos + 20, 0);
        ctx.lineTo(xpos + 20, -60);
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.restore();

        xpos += 30;

    }

    function sub(text) {

        ctx.save();

        ctx.font = 'italic 15pt Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, xpos + 30, 20);

        ctx.restore();

    }

    function sup(text) {

        ctx.save();

        ctx.font = 'italic 15pt Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, xpos + 30, -65);

        ctx.restore();

    }

    function comma() {

        ctx.save();

        ctx.font = 'bold italic 30pt Arial';
        ctx.textAlign = 'center';
        ctx.fillText(',', xpos+10, 0);

        ctx.restore();

        xpos += 20;

    }

    function triplet() {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.font = 'bold italic 15pt Arial';
        ctx.textAlign = 'center';

        ctx.fillText('T', xpos, -65);

        ctx.beginPath();
        ctx.moveTo(xpos - 7, -73);
        ctx.quadraticCurveTo(xpos - 27, -73, xpos - 30, -65);
        ctx.moveTo(xpos + 7, -73);
        ctx.quadraticCurveTo(xpos + 27, -73, xpos + 30, -65);
        ctx.stroke();

        ctx.restore();

    }

    function space(howmuch) {

        xpos += (howmuch ? howmuch : 20);

    }

    function negspace(howmuch) {

        xpos -= (howmuch ? howmuch : 20);

    }

    function high() {

        ypos = -15;

    }

    function mid() {

        ypos = 0;

    }

    function low() {

        ypos = 15;

    }

    function tsig(beats, measure) {

        ctx.save();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.font = 'bold 35pt Times';
        ctx.textAlign = 'center';

        var width = Math.max(ctx.measureText(beats).width, ctx.measureText(measure).width);

        ctx.textBaseline = 'alphabetic';
        ctx.fillText(beats, xpos + 10 + (width/2), -30);

        ctx.textBaseline = 'top';
        ctx.fillText(measure, xpos + 10 + (width/2), -30);

        ctx.restore();

        xpos += width + 20;

    }


    function repeat(times) {

        if (times === undefined) {
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
            ctx.arc(xpos + 0, -40, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xpos + 0, -20, 3, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(xpos + 10, 0);
            ctx.lineTo(xpos + 10, -60);
            ctx.moveTo(xpos + 20, 0);
            ctx.lineTo(xpos + 20, -60);
            ctx.stroke();

            width = 30;

            if (times > 2) {
                ctx.font = '24pt Arial';
                ctx.textAlign = 'start';
                ctx.textBaseline = 'middle';
                var label = '\u00d7' + times;
                ctx.fillText('\u00d7' + times, xpos + 30, -30);
                width += ctx.measureText(label).width + 5;
            }

            ctx.restore();

        }

        xpos += width;

    }

}
