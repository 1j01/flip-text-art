/* global GraphemeSplitter */
(() => {

	function memoize(fn) {
		const cache = new Map();
		return (...args) => {
			const key = JSON.stringify(args);
			if (!cache.has(key)) {
				cache.set(key, fn(...args));
			}
			return cache.get(key);
		};
	}
	function sum(accumulator, currentValue) {
		return accumulator + currentValue;
	}
	function uniquify(array) {
		return Array.from(new Set(array));
	}
	function findDuplicates(array) {
		return array.filter((value, index, self) => self.indexOf(value) !== index);
	}

	const measuringCanvas = document.createElement("canvas");
	const measuringContext = measuringCanvas.getContext("2d");
	measuringCanvas.width = measuringCanvas.height = 1;
	measuringContext.font = "16px monospace";
	const measureText = memoize((text) => {
		return measuringContext.measureText(text).width;
	});

	// Other spaces (en, em, hair, etc.) are often equal in a monospace font.
	const space = "\u0020";
	// const ideographicSpace = "\u3000";
	const spaceWidth = measureText(space);
	// const ideographicSpaceWidth = measureText(ideographicSpace);
	function fitSpaces(targetWidth, asciiOnly = false) {
		// if (asciiOnly) {
		return new Array(Math.round(targetWidth / spaceWidth) + 1).join(space);
		// }
		// const spaceCountMax = Math.ceil(targetWidth / spaceWidth);
		// const ideographicSpaceCountMax = Math.ceil(targetWidth / ideographicSpaceWidth);
		// let bestDifference = Infinity;
		// let bestString = "";
		// for (let spaceCount = 0; spaceCount <= spaceCountMax; spaceCount++) {
		// 	for (let ideographicSpaceCount = 0; ideographicSpaceCount <= ideographicSpaceCountMax; ideographicSpaceCount++) {
		// 		const width = spaceCount * spaceWidth + ideographicSpaceCount * ideographicSpaceWidth;
		// 		const difference = Math.abs(width - targetWidth);
		// 		if (difference < bestDifference) {
		// 			bestDifference = difference;
		// 			bestString = new Array(spaceCount + 1).join(space) + new Array(ideographicSpaceCount + 1).join(ideographicSpace);
		// 		}
		// 	}
		// }
		// return bestString;
	}

	// sort of lexical parsing, splitting lines then optionally splitting to alternating language and other text parts
	// (for a mediocre definition of language, excluding punctuation, etc.)
	const parseText = (text, { preserveWords = false } = {}) => {
		const lines = text.split(/\r?\n/);
		const rows = lines.map((line) => {
			const width = splitter.splitGraphemes(line).map(measureText).reduce(sum, 0);
			const graphemes = splitter.splitGraphemes(line);
			let parts = [];
			let currentPart = { text: "", graphemes: [], isWords: false };
			parts.push(currentPart);
			for (let i = 0; i < graphemes.length; i++) {
				if (preserveWords) {
					// look for a whole word at once
					let word = [], j = i;
					for (; j < graphemes.length; j++) {
						if (/\p{Letter}/u.test(graphemes[j])) {
							word.push(graphemes[j]);
						} else {
							break;
						}
					}
					// heuristic: filter out single letters but not "I", "a", or Chinese characters etc.
					if (word && word.length > 1 || word.join("").match(/[IAa]|[^A-Za-z]/)) {
						if (!currentPart.isWords) {
							// start a new part
							currentPart = { text: "", graphemes: [], isWords: true };
							parts.push(currentPart);
						}
						currentPart.text += word.join("");
						currentPart.graphemes.push(...word);
						i = j - 1;
						continue;
					}
				}
				if (currentPart.isWords) {
					// start a new part
					currentPart = { text: "", graphemes: [], isWords: false };
					parts.push(currentPart);
				}
				currentPart.text += graphemes[i];
				currentPart.graphemes.push(graphemes[i]);
			}
			// join adjacent words as parts
			if (preserveWords) {
				const newParts = [];
				for (let i = 0; i < parts.length; i++) {
					// the word parts are not themselves adjacent, there's a space between them
					if (parts[i].isWords && parts[i + 2]?.isWords && parts[i + 1]?.text.trim() === "") {
						newParts.push({
							text: parts[i].text + parts[i + 1].text + parts[i + 2].text,
							graphemes: [...parts[i].graphemes, ...parts[i + 1].graphemes, ...parts[i + 2].graphemes],
							isWords: true,
						});
						i += 2;
					} else {
						newParts.push(parts[i]);
					}
				}
				parts = newParts;
			}
			return { width, parts };
		});
		return rows;
	};

	function visualizeParse(rows) {
		const container = document.createElement("div");
		for (const row of rows) {
			const rowElement = document.createElement("pre");
			for (const part of row.parts) {
				const partElement = document.createElement("span");
				partElement.textContent = part.text;
				partElement.style.boxShadow = "0 0 3px black";
				partElement.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
				if (part.isWords) {
					partElement.style.backgroundColor = "rgba(255, 255, 0, 0.2)";
				}
				rowElement.appendChild(partElement);
			}
			container.appendChild(rowElement);
		}
		return container;
	}

	const splitter = new GraphemeSplitter();
	function flipText(text, asciiOnly = false, preserveWords = false, trimLines = true) {
		const rows = parseText(text, { preserveWords });
		const maxWidth = rows.reduce((acc, row) => Math.max(acc, row.width), 0);

		return rows.map(({ width, parts }) => {
			let text = fitSpaces(maxWidth - width, asciiOnly);
			text += parts.map((part) => {
				if (part.isWords && preserveWords) {
					return part.text;
				}
				return part.graphemes
					.map((grapheme) => flipGrapheme(grapheme, asciiOnly))
					.reverse()
					.join("");
			})
				.reverse()
				.join("");
			if (trimLines) {
				text = text.replace(/\s+$/g, "");
			}
			return text;
		}).join("\n");
	}

	function blockifyText(text) {
		const lines = text.split(/\r?\n/);
		const rows = lines.map((line) => {
			const width = splitter.splitGraphemes(line).map(measureText).reduce(sum, 0);
			return { width, line };
		});
		const maxWidth = rows.reduce((acc, row) => Math.max(acc, row.width), 0);
		return rows.map(({ width, line }) => {
			return line + fitSpaces(maxWidth - width);
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
		"┙": "┕",
		"┝": "┥",
		"┞": "┦",
		"┡": "┩",
		"┢": "┪",
		"┣": "┫",
		"┥": "┝",
		"┦": "┞",
		"┧": "┟",
		"┟": "┧",
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
		"▏": "▕",
		"▘": "▝",
		"▌": "▐",
		"▖": "▗",
		"▝": "▘",
		"▛": "▜",
		"▙": "▟",
		"▗": "▖",
		"▐": "▌",
		"▟": "▙",
		"▜": "▛",
		"▕": "▏",
		"▞": "▚",
		"▚": "▞",
		"🬀": "🬁",
		"🬁": "🬀",
		"🬃": "🬇",
		"🬄": "🬉",
		"🬅": "🬈",
		"🬆": "🬊",
		"🬇": "🬃",
		"🬈": "🬅",
		"🬉": "🬄",
		"🬊": "🬆",
		"🬌": "🬍",
		"🬍": "🬌",
		"🬏": "🬞",
		"🬐": "🬠",
		"🬑": "🬟",
		"🬒": "🬡",
		"🬓": "🬦",
		"🬔": "🬧",
		"🬕": "🬨",
		"🬖": "🬢",
		"🬗": "🬤",
		"🬘": "🬣",
		"🬙": "🬥",
		"🬚": "🬩",
		"🬛": "🬫",
		"🬜": "🬪",
		"🬝": "🬬",
		"🬞": "🬏",
		"🬟": "🬑",
		"🬠": "🬐",
		"🬡": "🬒",
		"🬢": "🬖",
		"🬣": "🬘",
		"🬤": "🬗",
		"🬥": "🬙",
		"🬦": "🬓",
		"🬧": "🬔",
		"🬨": "🬕",
		"🬩": "🬚",
		"🬪": "🬜",
		"🬫": "🬛",
		"🬬": "🬝",
		"🬮": "🬯",
		"🬯": "🬮",
		"🬱": "🬵",
		"🬲": "🬷",
		"🬳": "🬶",
		"🬴": "🬸",
		"🬵": "🬱",
		"🬶": "🬳",
		"🬷": "🬲",
		"🬸": "🬴",
		"🬺": "🬻",
		"🬻": "🬺",
		"🬼": "🭇",
		"🬽": "🭈",
		"🬾": "🭉",
		"🬿": "🭊",
		"🭀": "🭋",
		"🭁": "🭌",
		"🭂": "🭍",
		"🭃": "🭎",
		"🭄": "🭏",
		"🭅": "🭐",
		"🭆": "🭑",
		"🭇": "🬼",
		"🭈": "🬽",
		"🭉": "🬾",
		"🭊": "🬿",
		"🭋": "🭀",
		"🭌": "🭁",
		"🭍": "🭂",
		"🭎": "🭃",
		"🭏": "🭄",
		"🭐": "🭅",
		"🭑": "🭆",
		"🭒": "🭝",
		"🭓": "🭞",
		"🭔": "🭟",
		"🭕": "🭠",
		"🭖": "🭡",
		"🭗": "🭢",
		"🭘": "🭣",
		"🭙": "🭤",
		"🭚": "🭥",
		"🭛": "🭦",
		"🭜": "🭧",
		"🭝": "🭒",
		"🭞": "🭓",
		"🭟": "🭔",
		"🭠": "🭕",
		"🭡": "🭖",
		"🭢": "🭗",
		"🭣": "🭘",
		"🭤": "🭙",
		"🭥": "🭚",
		"🭦": "🭛",
		"🭧": "🭜",
		"🭨": "🭪",
		"🭪": "🭨",
		"🭬": "🭮",
		"🭮": "🭬",
		"🭰": "🭵",
		"🭱": "🭴",
		"🭲": "🭳",
		"🭳": "🭲",
		"🭴": "🭱",
		"🭵": "🭰",
		"🭼": "🭿",
		"🭽": "🭾",
		"🭾": "🭽",
		"🭿": "🭼",
		"🮕": "🮖",
		"🮖": "🮕",
		"🮘": "🮙",
		"🮙": "🮘",
		"🮠": "🮡",
		"🮡": "🮠",
		"🮢": "🮣",
		"🮣": "🮢",
		"🮤": "🮥",
		"🮥": "🮤",
		"🮨": "🮩",
		"🮩": "🮨",
		"🮪": "🮫",
		"🮫": "🮪",
		"🮬": "🮭",
		"🮭": "🮬",
		"🮵": "🮶",
		"🮶": "🮵",
		"🮜": "🮝",
		"🮝": "🮜",
		"🮞": "🮟",
		"🮟": "🮞",
		"🮌": "🮍",
		"🮍": "🮌",
		"▉": "🮋",
		"🮋": "▉",
		"▊": "🮊",
		"🮊": "▊",
		"▋": "🮉",
		"🮉": "▋",
		"▍": "🮈",
		"🮈": "▍",
		"▎": "🮇",
		"🮇": "▎",
		// "🯲": "🯵",
		// "🯵": "🯲",
		// "🯁🯂🯃": "👈 ",
		"👈": "👉",
		"👉": "👈",
		// "🮲🮳": "🏃",
		// "🏃": "🮲🮳",
		"🯇": "🯈",
		"🯈": "🯇",
		"◂": "▸",
		"▸": "◂",
		"◝": "◜",
		"◜": "◝",
		"◞": "◟",
		"◟": "◞",
		"◤": "◥",
		"►": "◄",
		"◃": "▹",
		"▶": "◀",
		"◄": "►",
		"▹": "◃",
		"◥": "◤",
		"◸": "◹",
		"◖": "◗",
		"◣": "◢",
		"◢": "◣",
		"◗": "◖",
		"◀": "▶",
		"▻": "◅",
		"◨": "◧",
		"◺": "◿",
		"◰": "◳",
		"◳": "◰",
		"◿": "◺",
		"◹": "◸",
		"◧": "◨",
		"▧": "▨",
		"▨": "▧",
		"▷": "◁",
		"◁": "▷",
		"◅": "▻",
		"◐": "◑",
		"◑": "◐",
		"◭": "◮",
		"◮": "◭",
		"◱": "◲",
		"◲": "◱",
		"◴": "◷",
		"◵": "◶",
		"◶": "◵",
		"◷": "◴",
		"⏢": "▱", // (dubious) or ▭ (symmetricalize)
		"▱": "⏢", // (dubious) or ▭ (symmetricalize)
		"?": "⸮",
		"⸮": "?",
		"1": "Ɩ",
		"Ɩ": "1",
		"2": "ς",
		"ς": "2",
		"3": "Ɛ",
		"Ɛ": "3",
		"4": "߂", // or ᔨ or բ or ᖨ or ߂ or μ
		"߂": "4",
		"5": "ट",
		"ट": "5",
		"6": "მ",
		"მ": "6",
		"7": "٢", // or Ⲋ or ߖ (RTL)
		"٢": "7",
		"9": "୧",
		"୧": "9",
		"a": "ɒ", // or ઠ or ₆ or 6
		"ɒ": "ɑ", // or a
		"ɑ": "ɒ",
		"b": "d",
		"c": "ɔ",
		"ɔ": "c",
		"d": "b",
		"e": "ɘ",
		"ɘ": "e",
		"f": "ʇ",
		"ʇ": "f",
		"g": "ϱ",
		"ϱ": "g",
		"h": "⑁", // or ᖽ or ᖹ or Ꮧ or H
		"⑁": "h",
		"j": "ᒑ", // or į or ᒫ or ⇂ or ᢺ
		"ᒑ": "j",
		"k": "ʞ",
		"ʞ": "k",
		"r": "ɿ",
		"ɿ": "r",
		"s": "ƨ",
		"ƨ": "s",
		"t": "Ɉ",
		"Ɉ": "t",
		"u": "υ",
		"υ": "u",
		"y": "γ",
		"B": "ઘ", // or Ƌ or 8 or 𐌇
		"ઘ": "B",
		"C": "Ɔ",
		"Ɔ": "C",
		"D": "ᗡ", // or Ⴇ
		"ᗡ": "D",
		"E": "Ǝ",
		"Ǝ": "E",
		"F": "ꟻ", // or ߔ or ╕ or ᆿ or 7 or ᒣ
		"ꟻ": "F",
		"G": "Ә",
		"Ә": "G",
		"J": "Ⴑ", // or し
		"Ⴑ": "J",
		"K": "ﻼ",
		"ﻼ": "K",
		"L": "⅃",
		"⅃": "L",
		"N": "И",
		"И": "N",
		"P": "ꟼ", // or Գ
		"ꟼ": "P",
		"Q": "Ϙ",
		// "Ϙ": "Q",
		"R": "Я",
		"Я": "R",
		"S": "Ƨ", // or Ꙅ
		"Ƨ": "S",
		"Z": "\u29f5\u0304\u0332", // or "\u29f5\u0305\u0332" or ⦣̅ or 5 or or \ or ⋝ or Ƹ or ⧖/ⴵ or Σ or ﭶ or ﳎ or צּ or ﮑ/ﻜ or ݎ or ܠ̅ (note: some of those are RTL)
		"\u29f5\u0304\u0332": "Z",
		"z": "⦣̅",
		"⦣̅": "z",
		"⋝": "⋜", // or Z
		"⋜": "⋝",
		"≤": "≥",
		"≥": "≤",
		"&": "კ", // or ₰ or 𐒈 or Ֆ
		"₰": "&",
		"კ": "&",
		"𐒈": "&",
		"Ֆ": "&",
	};
	const symmetricalGlyphs = [
		"V",
		"W",
		"M",
		"T",
		"Y",
		"U",
		"I",
		"O",
		"A",
		"H",
		"X",
		"u",
		"i",
		"o",
		"w",
		"l",
		"x",
		"m",
		"n",
		"v",
		"!",
		"#",
		":",
		".",
		"8",
		"0",
		"-",
		"_",
		"=",
		"+",
		"|",
		"*",
		"^",
		"■",
		"□",
		"▢",
		"▣",
		"▤",
		"▥",
		"▦",
		"▩",
		"▪",
		"▫",
		"▬",
		"▭",
		"▮",
		"▯",
		"▲",
		"△",
		"▴",
		"▵",
		"▼",
		"▽",
		"▾",
		"▿",
		"◆",
		"◇",
		"◈",
		"◉",
		"◊",
		"○",
		"◌",
		"◍",
		"◎",
		"●",
		"◒",
		"◓",
		"◘",
		"◙",
		"◚",
		"◛",
		"◠",
		"◡",
		"◦",
		"◫",
		"◬",
		"◯",
		"◻",
		"◼",
		"◽",
		"◾",
		"🬂",
		"🬋",
		"🬎",
		"🬭",
		"🬰",
		"🬹",
		"🭩",
		"🭫",
		"🭭",
		"🭯",
		"🭶",
		"🭷",
		"🭸",
		"🭹",
		"🭺",
		"🭻",
		"🮀",
		"🮁",
		"🮂",
		"🮃",
		"🮄",
		"🮅",
		"🮆",
		"🮎",
		"🮏",
		"🮐",
		"🮑",
		"🮒",
		"🮗",
		"🮚",
		"🮛",
		"🮦",
		"🮧",
		"🮮",
		"🮯",
		"🮻",
		"🮽",
		"🮿",
		"🯀",
		"🯅",
		"🯆",
		"🯉",
		"🯊",
		"🯰",
		"🯸",
		"\n",
		"\r",
		"\t",
		" ",
	];
	const duplicatesInSymmetricalGlyphs = findDuplicates(symmetricalGlyphs);
	if (duplicatesInSymmetricalGlyphs.length > 0) {
		console.log("Duplicates in symmetricalGlyphs:", duplicatesInSymmetricalGlyphs);
	}

	const acceptedOneWayFlips = [
		"Q", "a", "Ֆ", "𐒈", "₰", "y"
	];
	const duplicatesInAcceptedOneWayFlips = findDuplicates(acceptedOneWayFlips);
	if (duplicatesInAcceptedOneWayFlips.length > 0) {
		console.log("Duplicates in acceptedOneWayFlips:", duplicatesInAcceptedOneWayFlips);
	}
	// detect one-way flips
	// const unacceptedOneWayFlips = [];
	// for (const mapping of [asciiMirrorCharacters, unicodeMirrorCharacters]) {
	// 	for (const [key, value] of Object.entries(mapping)) {
	// 		if (mapping[value] !== key && !acceptedOneWayFlips.includes(key)) {
	// 			unacceptedOneWayFlips.push(key);
	// 		}
	// 	}
	// }
	// if (unacceptedOneWayFlips.length > 0) {
	// 	console.log("There are one-way flips that have not been accepted:", unacceptedOneWayFlips);
	// }
	const allKeys = uniquify(Object.keys(asciiMirrorCharacters).concat(Object.keys(unicodeMirrorCharacters)));
	const unacceptedOneWayFlips = [];
	for (const key of allKeys) {
		if (flipGrapheme(flipGrapheme(key)) !== key && !acceptedOneWayFlips.includes(key)) {
			const result = [key, flipGrapheme(key)];
			if (flipGrapheme(flipGrapheme(key)) !== flipGrapheme(key)) {
				result.push(flipGrapheme(flipGrapheme(key)));
			}
			unacceptedOneWayFlips.push(result);
		}
	}
	if (unacceptedOneWayFlips.length > 0) {
		console.log("There are one-way flips that have not been accepted:", unacceptedOneWayFlips.map((array) =>
			array.join(" ⟶ ")
		));
	}
	// detect accepted one-way flips that are not one-way (keeping the acceptance list sensible)
	const acceptedOneWayFlipsNotOneWay = [];
	for (const accepted of acceptedOneWayFlips) {
		if (flipGrapheme(flipGrapheme(accepted)) === accepted) {
			acceptedOneWayFlipsNotOneWay.push([accepted, flipGrapheme(accepted), flipGrapheme(flipGrapheme(accepted))]);
		}
	}
	if (acceptedOneWayFlipsNotOneWay.length > 0) {
		console.log("There are accepted one-way flips that are not one-way:", acceptedOneWayFlipsNotOneWay.map((array) =>
			array.join(" ⟶ ")
		));
	}
	// detect mappings that won't apply because the text won't be split at that boundary
	const unapplicableMappings = [];
	for (const grapheme of allKeys) {
		if (!splitter.splitGraphemes(`Test${grapheme}Test`).includes(grapheme)) {
			unapplicableMappings.push(grapheme);
		} else if (`<${flipGrapheme(grapheme)}>` !== flipText(`<${grapheme}>`)) {
			console.warn("How did this happen? splitGraphemes gives the key, but flipText doesn't give the same result?");
			unapplicableMappings.push(grapheme);
		}
	}
	if (unapplicableMappings.length > 0) {
		console.log("There are mappings that won't apply because the text won't be split at that boundary:", unapplicableMappings);
	}

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
		if (typeof searchGlyphs === "string") {
			searchGlyphs = splitter.splitGraphemes(searchGlyphs);
		}
		searchGlyphs = uniquify(searchGlyphs);

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
				if (unicodeMirrorCharacters[glyph1] === glyph2 || asciiMirrorCharacters[glyph2] === glyph1) {
					console.log("Already a known mirror, skipping:", glyph1, glyph2);
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

	function detectMissingMirrors(searchGlyphs) {
		if (typeof searchGlyphs === "string") {
			searchGlyphs = splitter.splitGraphemes(searchGlyphs);
		}
		searchGlyphs = uniquify(searchGlyphs);

		const missingMirrors = [];
		for (const glyph of searchGlyphs) {
			if (
				!(glyph in unicodeMirrorCharacters) &&
				!(glyph in asciiMirrorCharacters) &&
				!symmetricalGlyphs.includes(glyph)
			) {
				missingMirrors.push(glyph);
			}
		}

		if (missingMirrors.length > 0) {
			console.log("There are missing mirrors (not mapped or marked as symmetrical):", missingMirrors);
		}
		// return missingMirrors;
	}

	window.flipText = flipText;
	flipText.parseText = parseText;
	flipText.visualizeParse = visualizeParse;
	flipText.blockifyText = blockifyText;
	flipText.findNewMirrors = findNewMirrors;
	flipText.detectMissingMirrors = detectMissingMirrors;

	// console.log(findNewMirrors("AB{}[]()<>"));
	// console.log(findNewMirrors("▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟"));
	// const symbolsForLegacyComputing = `
	// 	0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
	// 	U+1FB0x	🬀	🬁	🬂	🬃	🬄	🬅	🬆	🬇	🬈	🬉	🬊	🬋	🬌	🬍	🬎	🬏
	// 	U+1FB1x	🬐	🬑	🬒	🬓	🬔	🬕	🬖	🬗	🬘	🬙	🬚	🬛	🬜	🬝	🬞	🬟
	// 	U+1FB2x	🬠	🬡	🬢	🬣	🬤	🬥	🬦	🬧	🬨	🬩	🬪	🬫	🬬	🬭	🬮	🬯
	// 	U+1FB3x	🬰	🬱	🬲	🬳	🬴	🬵	🬶	🬷	🬸	🬹	🬺	🬻	🬼	🬽	🬾	🬿
	// 	U+1FB4x	🭀	🭁	🭂	🭃	🭄	🭅	🭆	🭇	🭈	🭉	🭊	🭋	🭌	🭍	🭎	🭏
	// 	U+1FB5x	🭐	🭑	🭒	🭓	🭔	🭕	🭖	🭗	🭘	🭙	🭚	🭛	🭜	🭝	🭞	🭟
	// 	U+1FB6x	🭠	🭡	🭢	🭣	🭤	🭥	🭦	🭧	🭨	🭩	🭪	🭫	🭬	🭭	🭮	🭯
	// 	U+1FB7x	🭰	🭱	🭲	🭳	🭴	🭵	🭶	🭷	🭸	🭹	🭺	🭻	🭼	🭽	🭾	🭿
	// 	U+1FB8x	🮀	🮁	🮂	🮃	🮄	🮅	🮆	🮇	🮈	🮉	🮊	🮋	🮌	🮍	🮎	🮏
	// 	U+1FB9x	🮐	🮑	🮒		🮔	🮕	🮖	🮗	🮘	🮙	🮚	🮛	🮜	🮝	🮞	🮟
	// 	U+1FBAx	🮠	🮡	🮢	🮣	🮤	🮥	🮦	🮧	🮨	🮩	🮪	🮫	🮬	🮭	🮮	🮯
	// 	U+1FBBx	🮰	🮱	🮲	🮳	🮴	🮵	🮶	🮷	🮸	🮹	🮺	🮻	🮼	🮽	🮾	🮿
	// 	U+1FBCx	🯀	🯁	🯂	🯃	🯄	🯅	🯆	🯇	🯈	🯉	🯊
	// 	U+1FBDx
	// 	U+1FBEx
	// 	U+1FBFx	🯰	🯱	🯲	🯳	🯴	🯵	🯶	🯷	🯸	🯹
	// `;
	// const geometricShapes = `
	// 	0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
	// 	U+25Ax	■	□	▢	▣	▤	▥	▦	▧	▨	▩	▪	▫	▬	▭	▮	▯
	// 	U+25Bx	▰	▱	▲	△	▴	▵	▶	▷	▸	▹	►	▻	▼	▽	▾	▿
	// 	U+25Cx	◀	◁	◂	◃	◄	◅	◆	◇	◈	◉	◊	○	◌	◍	◎	●
	// 	U+25Dx	◐	◑	◒	◓	◔	◕	◖	◗	◘	◙	◚	◛	◜	◝	◞	◟
	// 	U+25Ex	◠	◡	◢	◣	◤	◥	◦	◧	◨	◩	◪	◫	◬	◭	◮	◯
	// 	U+25Fx	◰	◱	◲	◳	◴	◵	◶	◷	◸	◹	◺	◻	◼	◽	◾	◿
	// `;
	// findNewMirrors(symbolsForLegacyComputing);
	// detectMissingMirrors(symbolsForLegacyComputing);
	// findNewMirrors(geometricShapes);
	// detectMissingMirrors(geometricShapes);
	detectMissingMirrors("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");

})();