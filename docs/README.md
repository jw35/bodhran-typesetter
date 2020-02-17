# Bodhrán Typesetter

Some Javascript for including Bodhrán sticking and rhythm diagrams on web
pages. Using this it's fairly easy to produce things like this:

![example pattern](example.png)

Further live examples at https://jw35.github.io/bodhran-typesetter/

This is really intended for displaying short snippets - while you could use
it to create longer examples this would quickly become tedious.

## Usage

1. Include `bodhran-typesetter.js` in you html page:

```
    <script src="bodhran-typesetter.js"></script>
```

2. Add one or more HTML `<canvas>` elements to your page with
   `class="notation"`:

```
    <canvas class="notation">
    </canvas>
```

3. Make the body of the canvas a notation string as described below:

```
    <canvas class="notation">
       Dudu, Dudu |
    </canvas>
```

The Javascript will process each such canvas, set its height and width
and draw an appropriate diagram on it.

If you don't like the way this automatically locates canvases to process
and reads the notation out of their bodies then you can create plain
canvases without `class="notation"` and then pass each one along with a notation
string and a scale factor to `BodhranTypesetter.display_notation(canvas, notation, scale)`.

## Notation

Notations consist of a string of characters in a scheme vaguely
inspired by [ABC Notation](http://abcnotation.com/). Whitespace is
ignored in notations and can be used freely to improve
readability.

The characters recognised in the notation are:

Character | Symbol
:-------: | ------
d | Downstroke
u | Upstroke
s | Stab
D | Strong downstroke
U | Strong upstroke
S | Strong stab
\- | Dash
\| | Bar
Z or z | Thin-thick double bar ('z' = 'end')
X or x | Repeat ('x' = 'times')
X\<n\> or x\<n\> | Repeat **n** times (**n** must be a number)
, | Comma
\# | Half-width space
b | Negative half-width space ('b' = 'back')
\+ | Triplet made up of the previous and next symbol
T\<b\>/\<u\> | Time signature **b/u** (**b** and **u** must be numbers)
t\<b\>/\<u\> | Invisible time signature **b/u** (for alignment, **b** and **u** must be numbers)
"\<text\>" | Display **text** as annotation above or below the next symbol. If text starts '^' it is displayed above; if it starts '_' it is displayed below; if neither then it is currently displayed below.
^ | Display following symbols raised
_ | Display following symbols lowered
= | Display following symbols centred (default)

* There's no attempt to stop annotations overlapping. Further, the triplet notation and
annotations above the symbols use the same space and so can't be used together.

* There's no line wrapping - the canvas element will be made as long as is needed to
display the notation provided on a single line. How this will display or print is up to the browser.
This all works best for short notation fragments.

* If any symbols are raised or lowered then a centerline is automatically drawn
to make it easier to see their relationship.

* There is next to no error checking. Syntactically-valid notations will
(should) produce the expected diagrams; anything else might do anything,
including throwing Javascript exceptions which will prevent some or all
subsequent notation from displaying. Your browser's Javascript error log may throw
some light on what has gone wrong.

## Contributing

I wrote this for my own benefit. It supports the features I want and might be
extended in the future if I need other things. Suggestions, or (better) pull requests
are welcome, but I reserve the right to ignore them if it suites me.
