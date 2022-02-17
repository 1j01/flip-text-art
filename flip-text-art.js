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
		// document.body.appendChild(canvas);
		const imageDataForGlyph = {};
		for (const glyph of searchGlyphs) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillText(glyph, 0, 0);
			// debugger;
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			imageDataForGlyph[glyph] = imageData;
		}
		const matches = [];
		for (const glyph1 of searchGlyphs) {
			for (const glyph2 of searchGlyphs) {
				if (glyph1 === glyph2) {
					continue;
				}
				const imageData1 = imageDataForGlyph[glyph1];
				const imageData2 = imageDataForGlyph[glyph2];
				let diff = 0;
				const { width, height } = imageData1;
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < width; x++) {
						const index1 = (y * width + x) * 4 + 3;
						const index2 = (y * width + (width - 1 - x)) * 4 + 3;
						diff += Math.abs(imageData1.data[index1] - imageData2.data[index2]);
					}
				}
				diff /= imageData1.data.length / 4;
				diff /= 255;
				// if (diff < 0.125) {
				// 	matches.push([glyph1, glyph2]);
				// }
				matches.push([glyph1, glyph2, diff]);
			}
		}
		return matches;
	}

	window.flipText = flipText;
	window.findNewMirrors = findNewMirrors;

	// console.log(findNewMirrors("AB{}[]()<>"));
	console.log(findNewMirrors("▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟"));
})();