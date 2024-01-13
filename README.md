# Flip Text Art

This [web app](https://1j01.github.io/flip-text-art) lets you mirror any ASCII art or Unicode text art.

It uses a lengthy list of pairs of characters that look like horizontal mirrors of each other,
and flips entire texts, optionally preserving words within the text.

## Web App Usage

Paste text into the text area on either side, and it will be flipped automatically to the opposite side.

Below, you will find an output text area that combines the two sides, in case you want a mirror effect, rather than just art facing the other way.

Several options are available. Toggling any of them will take immediate effect. Play around with it!

- **ASCII Only**: only use ASCII character mirrors. This will give less accurate mirrored text, but if the input is ASCII, the output will be ASCII.
- **Preserve Words/Initials**: try to preserve segments of natural language within the text, un-flipped. This is good to preserve the initials of the author of the ASCII art, commonly included in or near the art.
- **Trim Lines**: trim whitespace from the end of the resulting lines. When toggling this option, it will briefly highlight the length of the lines, to show the difference.
- **Visualize Text Scanning**: highlight segments of the text that are detected as natural language in yellow, and other segments in blue. The highlighting applies to the input text area (the last edited side). You can still edit the text while this is enabled.

Note: there are a few one-way mirrors (A➔B), where the best mirror for B is not A. Other than these special cases, flipping the output back to the input should give the original text.

## JS Library Usage

This text transform is available as a JavaScript library.

It has one dependency, on [grapheme-splitter.js](https://github.com/orling/grapheme-splitter).

Note that it also uses the Canvas API, to measure the width of text, in order to align the text to the right,
by adding spaces to the left of the text.

```html
<script src="grapheme-splitter.js"></script>
<script src="flip-text-art.js"></script>
<script>
	const flippedText = flipText('Hello world! :)'); // '(: !blɿow ollɘH'
	const partiallyFlippedText = flipText('Hello world! :)', { preserveWords: true }); // '(: !Hello world'
	const flippedBack = flipText(flippedText); // 'Hello world! :)'
</script>
```

### API

#### `flipText(text, { asciiOnly = false, preserveWords = false, trimLines = true } = {})`

Flips the given text, optionally preserving words within the text.

Options:
- `asciiOnly` (default `false`): only use ASCII character mirrors. This will give less accurate mirrored text, but if the input is ASCII, the output will be ASCII.
- `preserveWords` (default `false`): try to preserve segments of natural language within the text, un-flipped.
- `trimLines` (default `true`): trim whitespace from the end of the resulting lines.

#### `flipText.parseText(text, { preserveWords = false } = {})`

Returns an array of row objects representing the text, with the following properties:
- `width`: the width of the row in graphemes
- `parts`: an array of part objects

Each part has the following properties:
- `text`: the text of the segment
- `graphemes`: an array of graphemes in the segment
- `isWords`: whether the segment was detected as natural language

#### `flipText.visualizeParse(rows)`

Returns an HTML element visualizing the result of `flipText.parseText`.

#### `flipText.blockifyText(text)`

Adds whitespace to the end of each line of text so that each line is approximately the same width.
This uses measurements from the Canvas API.

#### `flipText.searchForMirrorsWithVisualMatching(searchGlyphs)`

Automatically searches for mirror pairs of characters that look like each other (flipped),
by comparing pixel overlap of the glyphs, for each unique glyph in the given text or list of graphemes.

#### `flipText.searchForMirrorsInUnicodeData()`

Loads Unicode data from a text file, and searches for mirror pairs based on their names, using a fixed set of rules, like "left/right", "anticlockwise/clockwise", and "reverse" vs not "reverse".

#### `flipText.detectMissingMirrors(searchGlyphs)`

Detects characters that do not have a mirror mapping, within the given text, or list of graphemes.

## Development

If you want to contribute, or run the web app locally, here's how to get started.

### Setup

You'll need [Node.js](https://nodejs.org/) installed.

```sh
git clone https://github.com/1j01/flip-text-art.git
cd flip-text-art
npm install
```

### Running

This will start a live-reloading development server, and open up the web app in your browser:

```sh
npm start
```

### Quality Assurance

Tests are written with [Jest](https://jestjs.io/).
Code is kept consistent with [ESLint](https://eslint.org/), and spelling is checked with [cspell](https://cspell.org/),
both of which are included in the `lint` script.

```sh
npm test
npm run lint
```

## License

[MIT License](./MIT-LICENSE.txt)
