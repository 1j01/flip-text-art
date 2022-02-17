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

	const flippedCharacters = {
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
		"“": "”",
		"”": "“",
		"‘": "’",
		"’": "‘",
		// "A": "A",
		// "Y": "Y",
		// "W": "W",
		// "T": "T",
		// "V": "V",
		// "H": "H",
		// "I": "I",
		// "U": "U",
		// "O": "O",
		// ":": ":",
		// ".": ".",
	};

	function flipGrapheme(grapheme) {
		if (grapheme in flippedCharacters) {
			return flippedCharacters[grapheme];
		} else {
			return grapheme;
		}
	}

	window.flipText = flipText;

})();