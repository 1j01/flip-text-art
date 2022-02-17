(() => {

	const splitter = new GraphemeSplitter();
	function flipText(text, asciiOnly = false) {
		const lines = text.split(/\r?\n/);
		const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
		return lines.map((line) => {
			const graphemes = splitter.splitGraphemes(line);
			return graphemes
				.map((grapheme) => flipGrapheme(grapheme, asciiOnly))
				.reverse()
				.join("")
				.padStart(width, " ");
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
		"┚": "┖",
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
		"╉": "╊",
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
		"╟": "╢",
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

	function flipGrapheme(grapheme, asciiOnly) {
		if (grapheme in unicodeMirrorCharacters && !asciiOnly) {
			return unicodeMirrorCharacters[grapheme];
		} else if (grapheme in asciiMirrorCharacters) {
			return asciiMirrorCharacters[grapheme];
		} else {
			return grapheme;
		}
	}

	// TODO: use shape contexts as attributes for a weighted bipartite matching problem
	function findNewMirrors(searchGlyphs) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = 20;
		canvas.height = 20;
		ctx.font = "16px monospace";
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		if (window.debugMirrorSearch) {
			document.body.appendChild(canvas);
		}
		const matches = [];
		for (const glyph1 of searchGlyphs) {
			for (const glyph2 of searchGlyphs) {
				if (glyph1 === glyph2) {
					continue;
				}

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillText(glyph1, 0, 0);
				ctx.save();
				// ctx.translate(canvas.width, 0);
				ctx.scale(-1, 1);
				ctx.textAlign = "right";
				ctx.globalCompositeOperation = "xor";
				ctx.fillText(glyph2, 0, 0);
				ctx.restore();

				const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
				let diff = 0;
				for (let i = 0; i < data.length; i += 4) {
					diff += data[i + 3];
				}
				diff /= data.length / 4 * 255;

				// if (diff < 0.03) {
				// 	matches.push([glyph1, glyph2]);
				// }
				matches.push([glyph1, glyph2, diff]);
			}
		}
		matches.sort((a, b) => a[2] - b[2]);
		return matches;
	}

	window.flipText = flipText;
	window.findNewMirrors = findNewMirrors;

	// console.log(findNewMirrors("AB{}[]()<>"));
	console.log(findNewMirrors("▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟"));
})();