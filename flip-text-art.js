(() => {

	const splitter = new GraphemeSplitter();
	function flipText(text) {
		const lines = text.split(/\r?\n/);
		const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
		return lines.map((line) => {
			const graphemes = splitter.splitGraphemes(line);
			return graphemes.map(flipGrapheme).reverse().join("").padStart(width, " ");
		}).join("\n");
	}

	const asciiMirrorCharacters = {
		"[": "]",
		"]": "[",
		"(": ")",
		")": "(",
		"{": "}",
		"}": "{",
		"<": ">",
		">": "<",
		"/": "\\",
		"\\": "/",
		"|": "|",
		"`": "'",
		"'": "`",
		"7": "F", // or Y
		"F": "7",
		"p": "q",
		"q": "p",
		"b": "d",
		"d": "b",
		"3": "E",
		"E": "3",
		"S": "2",
		"2": "S",
		"Z": "5",
		"5": "Z",
		"J": "L",
		"L": "J",
		"s": "z",
		"z": "s",
		"K": "4", // or >
		"4": "R", // or \, K, A
		"R": "4",
		"P": "9",
		"9": "P",
		"?": "S", // one-way
		"g": "p", // one-way
		// "S": "?",
		// "@": "6",
		// "a": "6",
		// "6": "a",
		// "9": "e",
		"&": "B", // or b, 8, 3, S
		"B": "&",
		// qertypasdfghjkzcbQERPSDFGJKLZCBN
		// symmetrical glyphs:
		// VWMTYUIOAHXuiowlxnmv!#:.80-_=+|*^
		// "V": "V",
		// "W": "W",
		// "M": "M",
		// "T": "T",
		// "Y": "Y",
		// "U": "U",
		// "I": "I",
		// "O": "O",
		// "A": "A",
		// "H": "H",
		// "X": "X",
		// "u": "u",
		// "i": "i",
		// "o": "o",
		// "w": "w",
		// "l": "l",
		// "x": "x",
		// "m": "m",
		// "n": "n",
		// "v": "v",
		// "!": "!",
		// "#": "#",
		// ":": ":",
		// ".": ".",
		// "8": "8",
		// "0": "0",
		// "-": "-",
		// "_": "_",
		// "=": "=",
		// "+": "+",
		// "|": "|",
		// "*": "*",
		// "^": "^",
		// super-glyphs:
		// "c|": " b",
		// " K": ">|",
	};
	const unicodeMirrorCharacters = {
		"“": "”",
		"”": "“",
		"‘": "’",
		"’": "‘",
		"┌": "┐",
		"┐": "┌",
		"└": "┘",
		"┘": "└",
		"├": "┤",
		"┤": "├",
		"┍": "┑",
		"┑": "┍",
		"┎": "┒",
		"┒": "┎",
		"┏": "┓",
		"┓": "┏",
		"┗": "┛",
		"┛": "┗",
		"┠": "┨",
		"┨": "┠",
		"┕": "┙",
		"┖": "┚",
		"┗": "┛",
		"┙": "┕",
		"┝": "┥",
		"┞": "┦",
		"┠": "┨",
		"┡": "┩",
		"┢": "┪",
		"┣": "┫",
		"┥": "┝",
		"┦": "┞",
		"┧": "┟",
		"┟": "┧",
		"┨": "┠",
		"┩": "┡",
		"┪": "┢",
		"┫": "┣",
		"┭": "┮",
		"┮": "┭",
		"┱": "┲",
		"┲": "┱",
		"┵": "┶",
		"┶": "┵",
		"┹": "┺",
		"┺": "┹",
		"┽": "┾",
		"┾": "┽",
		"╃": "╄",
		"╄": "╃",
		"╅": "╆",
		"╆": "╅",
		"╊": "╉",
		"╒": "╕",
		"╓": "╖",
		"╔": "╗",
		"╕": "╒",
		"╖": "╓",
		"╗": "╔",
		"╘": "╛",
		"╙": "╜",
		"╚": "╝",
		"╛": "╘",
		"╜": "╙",
		"╝": "╚",
		"╞": "╡",
		"╠": "╣",
		"╡": "╞",
		"╢": "╟",
		"╣": "╠",
		"╭": "╮",
		"╮": "╭",
		"╯": "╰",
		"╰": "╯",
		"╱": "╲",
		"╲": "╱",
		"╴": "╶",
		"╶": "╴",
		"╸": "╺",
		"╺": "╸",
		"╼": "╾",
		"╾": "╼",
	};
	// detect one-way flips
	const oneWayFlips = [];
	for (const mapping of [asciiMirrorCharacters, unicodeMirrorCharacters]) {
		for (const [key, value] of Object.entries(mapping)) {
			if (mapping[value] !== key) {
				oneWayFlips.push(key);
			}
		}
	}
	console.log("One-way flips:", oneWayFlips);


	function flipGrapheme(grapheme) {
		// TODO: make unicode optional
		if (grapheme in unicodeMirrorCharacters) {
			return unicodeMirrorCharacters[grapheme];
		} else if (grapheme in asciiMirrorCharacters) {
			return asciiMirrorCharacters[grapheme];
		} else {
			return grapheme;
		}
	}

	window.flipText = flipText;

})();