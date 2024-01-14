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
	function fitSpaces(targetWidth /*, asciiOnly = false*/) {
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
					const newPart = { ...parts[i] };
					if (parts[i].isWords && parts[i + 2]?.isWords && parts[i + 1]?.text.trim() === "") {
						while (parts[i].isWords && parts[i + 2]?.isWords && parts[i + 1]?.text.trim() === "") {
							newPart.text += parts[i + 1].text + parts[i + 2].text;
							newPart.graphemes.push(...parts[i + 1].graphemes, ...parts[i + 2].graphemes);
							i += 2;
						}
					}
					newParts.push(newPart);
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
	function flipText(text, { asciiOnly = false, preserveWords = false, trimLines = true } = {}) {
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

	// #region data
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
		// "🯲": "🯵", // weird to interfere with semantics of seven-segment displays without reversing all digits
		// "🯵": "🯲", // (although these are perfect mirrors)
		"👈": "👉",
		"👉": "👈",
		// "🯁🯂🯃": "👈 ", // one-way mapping of three characters to one usually-two-wide emoji plus a space? dubious
		// "🮲🮳": "🏃", // two-way mapping of two characters to one usually-two-wide emoji? less dubious...
		// "🏃": "🮲🮳", // but the display is very different, given emoji are usually colored and not stick figures
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
		"⏢": "▱", // (dubious) or ▭ (symmetrize)
		"▱": "⏢", // (dubious) or ▭ (symmetrize)
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
		"c": "ɔ",
		"ɔ": "c",
		"e": "ɘ",
		"ɘ": "e",
		"f": "ʇ",
		"ʇ": "f",
		"g": "ϱ",
		"ϱ": "g",
		"h": "⑁", // or ᖽ or ᖹ or Ꮧ or H (symmetrize)
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
		"B": "ઘ", // or Ƌ or 8 (symmetrize) or 𐌇 (symmetrize)
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
		"Z": "\u29f5\u0304\u0332", // or "\u29f5\u0305\u0332" or ⦣̅ or 5 or or \ or ⋝ or Ƹ or ⧖/ⴵ (symmetrize) or Σ or ﭶ or ﳎ or צּ or ﮑ/ﻜ or ݎ or ܠ̅ (note: some of those are RTL)
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
		"ɜ": "ɛ",
		"ɞ": "ʚ",
		// "ɿ": "ɾ",
		"ʢ": "ʡ",
		"ˁ": "ˀ",
		"̔": "̓",
		"ͽ": "ͼ",
		"϶": "ϵ",
		"Ͻ": "Ϲ",
		"Ͽ": "Ͼ",
		"Ԑ": "З",
		"ԑ": "з",
		"ٝ": "ُ",
		"ܧ": "ܦ",
		"ྀ": "ི",
		"ཱྀ": "ཱི",
		"᚜": "᚛",
		"᳤": "᳣",
		"᳦": "᳥",
		"ᴎ": "ɴ",
		"ᴙ": "ʀ",
		"ᴲ": "ᴱ",
		"ᴻ": "ᴺ",
		"ᶔ": "ᶓ",
		"ᶟ": "ᵋ",
		"‵": "′",
		"‶": "″",
		"‷": "‴",
		"⁋": "¶",
		"⁏": ";",
		"Ↄ": "Ⅽ",
		"ↄ": "c",
		"∽": "~",
		"⌐": "¬",
		"☙": "❧",
		"⦣": "∠",
		"⦥": "⦤",
		"⦰": "∅",
		"⧹": "⧸",
		"⫭": "⫬",
		"⯾": "∟",
		"⸑": "⸐",
		"⹁": ",",
		"〝": "〞",
		"Ꙅ": "Ѕ",
		"ꙅ": "ѕ",
		"Ꙕ": "Ю",
		"ꙕ": "ю",
		"Ꙡ": "Ц",
		"ꙡ": "ц",
		"Ɜ": "Ɛ",
		"Ꟶ": "Ⱶ",
		"ꟶ": "ⱶ",
		"＼": "／",
		"𐞎": "ᵉ",
		"𐞴": "𐞳",
		"𑨉": "𑨁",
		"𜽬": "𜽛",
		"𝄃": "𝄂",
		"𝼁": "ɡ",
		"𝼃": "k",
		"𝼇": "ŋ",
		"🖑": "🖐",
		"🖒": "👍", // shows the same direction for me
		"🖓": "👎",
		"🖔": "✌",
		"🙽": "🙼",
		"🙿": "🙾",
		"󠁜": "󠀯",
		"ɛ": "ɜ",
		"ʚ": "ɞ",
		"ʡ": "ʢ",
		"ˀ": "ˁ",
		"̓": "̔",
		"ͼ": "ͽ",
		"ϵ": "϶",
		"Ϲ": "Ͻ",
		"Ͼ": "Ͽ",
		"З": "Ԑ",
		"з": "ԑ",
		"ُ": "ٝ",
		"ܦ": "ܧ",
		"ི": "ྀ",
		"ཱི": "ཱྀ",
		"᚛": "᚜",
		"᳣": "᳤",
		"᳥": "᳦",
		"ɴ": "ᴎ",
		"ʀ": "ᴙ",
		"ᴱ": "ᴲ",
		"ᴺ": "ᴻ",
		"ᶓ": "ᶔ",
		"ᵋ": "ᶟ",
		"′": "‵",
		"″": "‶",
		"‴": "‷",
		"¶": "⁋",
		";": "⁏",
		"Ⅽ": "Ↄ",
		// "c": "ↄ",
		"~": "∽",
		"¬": "⌐",
		"❧": "☙",
		"∠": "⦣",
		"⦤": "⦥",
		"∅": "⦰",
		"⧸": "⧹",
		"⫬": "⫭",
		"∟": "⯾",
		"⸐": "⸑",
		",": "⹁",
		"〞": "〝",
		"Ѕ": "Ꙅ",
		"ѕ": "ꙅ",
		"Ю": "Ꙕ",
		"ю": "ꙕ",
		"Ц": "Ꙡ",
		"ц": "ꙡ",
		// "Ɛ": "Ɜ",
		"Ⱶ": "Ꟶ",
		"ⱶ": "ꟶ",
		"／": "＼",
		"ᵉ": "𐞎",
		"𐞳": "𐞴",
		"𑨁": "𑨉",
		"𜽛": "𜽬",
		"𝄂": "𝄃",
		"ɡ": "𝼁",
		// "k": "𝼃",
		"ŋ": "𝼇",
		"🖐": "🖑",
		"👍": "🖒",
		"👎": "🖓",
		"✌": "🖔",
		"🙼": "🙽",
		"🙾": "🙿",
		"󠀯": "󠁜",
		"«": "»",
		"ʿ": "ʾ",
		"˂": "˃",
		"˓": "˒",
		"˱": "˲",
		"̘": "̙",
		"̜": "̹",
		"͑": "͗",
		"͔": "͕",
		"֎": "֍",
		"܆": "܇",
		// "ࡳ": "ࡲ", // can't see these, can't vet them (shows as code points)
		// "ࡸ": "ࡷ",
		// "ࢂ": "ࢁ",
		"ࣷ": "ࣸ",
		"ࣹ": "ࣺ",
		"࿖": "࿕",
		"࿘": "࿗",
		// "᫁": "᫂", // can't see these, can't vet them (shows as code points)
		// "᫃": "᫄",
		"᷷": "᷶",
		"᷸": "͘",
		"᷾": "͐",
		"‹": "›",
		"⁅": "⁆",
		"⁌": "⁍",
		"⁽": "⁾",
		"₍": "₎",
		"⃐": "⃑",
		"⃔": "⃕",
		"⃖": "⃗",
		// "⃚": "⃙", // not quite mirrors
		"⃭": "⃬",
		"⃮": "⃯",
		"←": "→",
		"↚": "↛",
		"↜": "↝",
		"↞": "↠",
		"↢": "↣",
		"↤": "↦",
		"↩": "↪",
		"↫": "↬",
		"↰": "↱",
		"↲": "↳",
		"↶": "↷",
		"↺": "↻",
		"↼": "⇀",
		"↽": "⇁",
		"↿": "↾",
		"⇃": "⇂",
		"⇇": "⇉",
		"⇍": "⇏", // not quite mirrors but ok
		"⇐": "⇒",
		"⇚": "⇛",
		"⇜": "⇝",
		"⇠": "⇢",
		"⇤": "⇥",
		"⇦": "⇨",
		"⇷": "⇸",
		"⇺": "⇻",
		"⇽": "⇾",
		// "∳": "∲", not mirrors
		"⊣": "⊢",
		"⋉": "⋊",
		"⋋": "⋌",
		"⌈": "⌉",
		"⌊": "⌋",
		"⌍": "⌌",
		"⌏": "⌎",
		"⌜": "⌝",
		"⌞": "⌟",
		"〈": "〉",
		"⌫": "⌦",
		"⍅": "⍆",
		"⍇": "⍈",
		"⎛": "⎞",
		"⎜": "⎟",
		"⎝": "⎠",
		"⎡": "⎤",
		"⎢": "⎥",
		"⎣": "⎦",
		"⎧": "⎫",
		"⎨": "⎬",
		"⎩": "⎭",
		"⎸": "⎹",
		"⏋": "⎾",
		"⏌": "⎿",
		"⏪": "⏩",
		"⏮": "⏭",
		"⏴": "⏵",
		"◩": "⬔",
		"☚": "☛",
		"☜": "☞",
		"⚟": "⚞",
		"⛦": "⛥",
		"❨": "❩",
		"❪": "❫",
		"❬": "❭",
		"❮": "❯",
		"❰": "❱",
		"❲": "❳",
		"❴": "❵",
		"➪": "➩",
		"⟅": "⟆",
		"⟕": "⟖",
		"⟞": "⟝",
		"⟢": "⟣",
		"⟤": "⟥",
		"⟦": "⟧",
		"⟨": "⟩",
		"⟪": "⟫",
		"⟬": "⟭",
		"⟮": "⟯",
		"⟲": "⟳",
		"⟵": "⟶",
		"⟸": "⟹",
		"⟻": "⟼",
		"⟽": "⟾",
		"⤂": "⤃",
		"⤆": "⤇",
		"⤌": "⤍",
		"⤎": "⤏",
		"⤙": "⤚",
		"⤛": "⤜",
		"⤝": "⤞",
		"⤟": "⤠",
		"⤶": "⤷",
		"⥀": "⥁",
		"⥆": "⥅",
		// "⥌": "⥏", // nope
		// "⥍": "⥏",
		// "⥑": "⥏",
		"⥒": "⥓",
		"⥖": "⥗",
		"⥘": "⥔",
		"⥙": "⥕",
		"⥚": "⥛",
		"⥞": "⥟",
		"⥠": "⥜",
		"⥡": "⥝",
		"⥢": "⥤",
		"⥪": "⥬",
		"⥫": "⥭",
		"⥳": "⥴",
		"⥼": "⥽",
		"⦃": "⦄",
		"⦅": "⦆",
		"⦇": "⦈",
		"⦉": "⦊",
		"⦋": "⦌",
		"⦍": "⦐",
		"⦏": "⦎",
		"⦑": "⦒",
		"⦗": "⦘",
		"⦩": "⦨",
		"⦫": "⦪",
		"⦭": "⦬",
		"⦯": "⦮",
		"⦴": "⦳",
		"⧑": "⧒",
		"⧔": "⧕",
		"⧘": "⧙",
		"⧚": "⧛",
		"⧨": "⧩",
		"⧼": "⧽",
		"⨭": "⨮",
		"⨴": "⨵",
		"⫍": "⫎",
		"⫥": "⊫",
		"⬅": "⮕",
		"⬐": "⬎",
		"⬑": "⬏",
		"⬕": "◪",
		"⬖": "⬗",
		"⬰": "⇴",
		"⬱": "⇶",
		"⬲": "⟴",
		"⬳": "⟿",
		"⬴": "⤀",
		"⬵": "⤁",
		"⬶": "⤅",
		"⬷": "⤐",
		"⬸": "⤑",
		"⬹": "⤔",
		"⬺": "⤕",
		"⬻": "⤖",
		"⬼": "⤗",
		"⬽": "⤘",
		"⬾": "⥇",
		"⬿": "⤳",
		"⭀": "⥱",
		// "⭁": "⭉", // only tilde is mirrored
		// "⭂": "⭊", // only tilde is mirrored
		"⭅": "⭆",
		// "⭇": "⥲", // only tilde is mirrored
		// "⭈": "⥵", // only tilde is mirrored
		"⭉": "⥲", // tilde isn't mirrored...
		"⭊": "⥵", // tilde isn't mirrored...
		// "⭋": "⥳", // only tilde is mirrored
		// "⭌": "⥴", // only tilde is mirrored
		// TODO: try to match those up better
		"⭠": "⭢",
		"⭪": "⭬",
		"⭯": "⭮",
		"⭰": "⭲",
		"⭺": "⭼",
		"⮄": "⮆",
		"⮈": "⮊",
		"⮎": "⮌",
		"⮐": "⮑",
		"⮒": "⮓",
		"⮘": "⮚",
		"⮜": "⮞",
		"⮠": "⮡",
		"⮢": "⮣",
		"⮤": "⮥",
		"⮦": "⮧",
		"⮨": "⮩",
		"⮪": "⮫",
		"⮬": "⮭",
		"⮮": "⮯",
		"⮰": "⮱",
		"⮲": "⮳",
		"⮴": "⮵",
		"⮶": "⮷",
		"⯇": "⯈",
		"⯨": "⯩",
		"⯪": "⯫",
		"⯬": "⯮",
		"⸂": "⸃",
		"⸄": "⸅",
		"⸉": "⸊",
		"⸌": "⸍",
		"⸜": "⸝",
		"⸠": "⸡",
		"⸢": "⸣",
		"⸤": "⸥",
		"⸦": "⸧",
		"⸨": "⸩",
		"⸶": "⸷",
		"⹑": "⹐",
		// "⹕": "⹖", // can't see these, can't vet 'em (shows as code points)
		// "⹗": "⹘",
		// "⹙": "⹚",
		// "⹛": "⹜",
		"⿸": "⿹",
		"〈": "〉",
		"《": "》",
		"「": "」",
		"『": "』",
		"【": "】",
		"〔": "〕",
		"〖": "〗",
		"〘": "〙",
		"〚": "〛",
		"㊧": "㊨",
		"꧁": "꧂", // not quite a perfect mirror but matching
		"꭪": "꭫",
		"﴾": "﴿",
		// can't see some of these due to them combining with the quotation marks
		// (and weirdly they show as tofu when commented out)
		// TODO: vet these
		// "︠": "︡",
		// "︢": "︣",
		// "︤": "︥",
		// "︧": "︨",
		// "︩": "︪",
		// "︫": "︬",
		// "︮": "︯",
		// these are not horizontal mirrors
		// "︵": "︶",
		// "︷": "︸",
		// "︹": "︺",
		// "︻": "︼",
		// "︽": "︾",
		// "︿": "﹀",
		// "﹁": "﹂",
		// "﹃": "﹄",
		// "﹇": "﹈",
		"﹙": "﹚",
		"﹛": "﹜",
		"﹝": "﹞",
		"（": "）",
		"［": "］",
		"｛": "｝",
		"｟": "｠",
		// "｢": "｣", // matching but not mirroring
		"￩": "￫",
		"𐡷": "𐡸",
		"𛱰": "𛱲",
		// "𜼀": "𜼌", can't see these, can't vet tofu
		// "𜼁": "𜼍",
		// "𜼂": "𜼎",
		// "𜼃": "𜼏",
		// "𜼄": "𜼐",
		// "𜼅": "𜼑",
		// "𜼆": "𜼒",
		// "𜼇": "𜼓",
		// "𜼈": "𜼔",
		// "𜼉": "𜼕",
		// "𜼊": "𜼖",
		// "𜼋": "𜼗",
		"𝄆": "𝄇",
		"𝅊": "𝅌",
		"𝅋": "𝅍",
		// "🔄": "🔃", // nope
		"🔍": "🔎",
		"🕃": "🕄",
		"🕻": "🕽",
		"🖉": "✎",
		"🖘": "🖙",
		"🖚": "🖛",
		"🖜": "🖝",
		"🗦": "🗧",
		"🗨": "🗩",
		"🗬": "🗭",
		"🗮": "🗯",
		"🙬": "🙮",
		"🞀": "🞂",
		"🠀": "🠂",
		"🠄": "🠆",
		"🠈": "🠊",
		"🠐": "🠒",
		"🠔": "🠖",
		"🠘": "🠚",
		"🠜": "🠞",
		"🠠": "🠢",
		"🠤": "🠦",
		"🠨": "🠪",
		"🠬": "🠮",
		"🠰": "🠲",
		"🠴": "🠶",
		"🠸": "🠺",
		"🠼": "🠾",
		"🡀": "🡂",
		"🡄": "🡆",
		"🡐": "🡒",
		"🡠": "🡢",
		"🡨": "🡪",
		"🡰": "🡲",
		"🡸": "🡺",
		"🢀": "🢂",
		"🢐": "🢒",
		"🢔": "🢖",
		"🢘": "🢚",
		"🢢": "🢣",
		"🢤": "🢥",
		"🢥": "🢤",
		"🢨": "🢩",
		"🢪": "🢫",
		"🤛": "🤜",
		"🤜": "🤛",
		"🫱": "🫲",
		"🫲": "🫱",
		// "🮲": "🮳", // not mirrors
		// "🮹": "🮺",
		// "🯁": "🯃",
		// can't see these (invisible?)
		// "󠀨": "󠀩",
		// "󠁛": "󠁝",
		// "󠁻": "󠁽",
		"»": "«",
		"ʾ": "ʿ",
		"˃": "˂",
		"˒": "˓",
		"˲": "˱",
		"̙": "̘",
		"̹": "̜",
		"͗": "͑",
		"͕": "͔",
		"֍": "֎",
		"܇": "܆",
		"ࣸ": "ࣷ",
		"ࣺ": "ࣹ",
		"࿕": "࿖",
		"࿗": "࿘",
		"᷶": "᷷",
		"͘": "᷸",
		"͐": "᷾",
		"›": "‹",
		"⁆": "⁅",
		"⁍": "⁌",
		"⁾": "⁽",
		"₎": "₍",
		"⃑": "⃐",
		"⃕": "⃔",
		"⃗": "⃖",
		"⃬": "⃭",
		"⃯": "⃮",
		"→": "←",
		"↛": "↚",
		"↝": "↜",
		"↠": "↞",
		"↣": "↢",
		"↦": "↤",
		"↪": "↩",
		"↬": "↫",
		"↱": "↰",
		"↳": "↲",
		"↷": "↶",
		"↻": "↺",
		"⇀": "↼",
		"⇁": "↽",
		"↾": "↿",
		"⇂": "⇃",
		"⇉": "⇇",
		"⇏": "⇍",
		"⇒": "⇐",
		"⇛": "⇚",
		"⇝": "⇜",
		"⇢": "⇠",
		"⇥": "⇤",
		"⇨": "⇦",
		"⇸": "⇷",
		"⇻": "⇺",
		"⇾": "⇽",
		"⊢": "⊣",
		"⋊": "⋉",
		"⋌": "⋋",
		"⌉": "⌈",
		"⌋": "⌊",
		"⌌": "⌍",
		"⌎": "⌏",
		"⌝": "⌜",
		"⌟": "⌞",
		"〉": "〈",
		"⌦": "⌫",
		"⍆": "⍅",
		"⍈": "⍇",
		"⎞": "⎛",
		"⎟": "⎜",
		"⎠": "⎝",
		"⎤": "⎡",
		"⎥": "⎢",
		"⎦": "⎣",
		"⎫": "⎧",
		"⎬": "⎨",
		"⎭": "⎩",
		"⎹": "⎸",
		"⎾": "⏋",
		"⎿": "⏌",
		"⏩": "⏪",
		"⏭": "⏮",
		"⏵": "⏴",
		"⬔": "◩",
		"☛": "☚",
		"☞": "☜",
		"⚞": "⚟",
		"⛥": "⛦",
		"❩": "❨",
		"❫": "❪",
		"❭": "❬",
		"❯": "❮",
		"❱": "❰",
		"❳": "❲",
		"❵": "❴",
		"➩": "➪",
		"⟆": "⟅",
		"⟖": "⟕",
		"⟝": "⟞",
		"⟣": "⟢",
		"⟥": "⟤",
		"⟧": "⟦",
		"⟩": "⟨",
		"⟫": "⟪",
		"⟭": "⟬",
		"⟯": "⟮",
		"⟳": "⟲",
		"⟶": "⟵",
		"⟹": "⟸",
		"⟼": "⟻",
		"⟾": "⟽",
		"⤃": "⤂",
		"⤇": "⤆",
		"⤍": "⤌",
		"⤏": "⤎",
		"⤚": "⤙",
		"⤜": "⤛",
		"⤞": "⤝",
		"⤠": "⤟",
		"⤷": "⤶",
		"⥁": "⥀",
		"⥅": "⥆",
		"⥓": "⥒",
		"⥗": "⥖",
		"⥔": "⥘",
		"⥕": "⥙",
		"⥛": "⥚",
		"⥟": "⥞",
		"⥜": "⥠",
		"⥝": "⥡",
		"⥤": "⥢",
		"⥬": "⥪",
		"⥭": "⥫",
		"⥴": "⥳",
		"⥽": "⥼",
		"⦄": "⦃",
		"⦆": "⦅",
		"⦈": "⦇",
		"⦊": "⦉",
		"⦌": "⦋",
		"⦐": "⦍",
		"⦎": "⦏",
		"⦒": "⦑",
		"⦘": "⦗",
		"⦨": "⦩",
		"⦪": "⦫",
		"⦬": "⦭",
		"⦮": "⦯",
		"⦳": "⦴",
		"⧒": "⧑",
		"⧕": "⧔",
		"⧙": "⧘",
		"⧛": "⧚",
		"⧩": "⧨",
		"⧽": "⧼",
		"⨮": "⨭",
		"⨵": "⨴",
		"⫎": "⫍",
		"⊫": "⫥",
		"⮕": "⬅",
		"⬎": "⬐",
		"⬏": "⬑",
		"◪": "⬕",
		"⬗": "⬖",
		"⇴": "⬰",
		"⇶": "⬱",
		"⟴": "⬲",
		"⟿": "⬳",
		"⤀": "⬴",
		"⤁": "⬵",
		"⤅": "⬶",
		"⤐": "⬷",
		"⤑": "⬸",
		"⤔": "⬹",
		"⤕": "⬺",
		"⤖": "⬻",
		"⤗": "⬼",
		"⤘": "⬽",
		"⥇": "⬾",
		"⤳": "⬿",
		"⥱": "⭀",
		"⭆": "⭅",
		"⥲": "⭉",
		"⥵": "⭊",
		"⭢": "⭠",
		"⭬": "⭪",
		"⭮": "⭯",
		"⭲": "⭰",
		"⭼": "⭺",
		"⮆": "⮄",
		"⮊": "⮈",
		"⮌": "⮎",
		"⮑": "⮐",
		"⮓": "⮒",
		"⮚": "⮘",
		"⮞": "⮜",
		"⮡": "⮠",
		"⮣": "⮢",
		"⮥": "⮤",
		"⮧": "⮦",
		"⮩": "⮨",
		"⮫": "⮪",
		"⮭": "⮬",
		"⮯": "⮮",
		"⮱": "⮰",
		"⮳": "⮲",
		"⮵": "⮴",
		"⮷": "⮶",
		"⯈": "⯇",
		"⯩": "⯨",
		"⯫": "⯪",
		"⯮": "⯬",
		"⸃": "⸂",
		"⸅": "⸄",
		"⸊": "⸉",
		"⸍": "⸌",
		"⸝": "⸜",
		"⸡": "⸠",
		"⸣": "⸢",
		"⸥": "⸤",
		"⸧": "⸦",
		"⸩": "⸨",
		"⸷": "⸶",
		"⹐": "⹑",
		"⿹": "⿸",
		"〉": "〈",
		"》": "《",
		"」": "「",
		"』": "『",
		"】": "【",
		"〕": "〔",
		"〗": "〖",
		"〙": "〘",
		"〛": "〚",
		"㊨": "㊧", // cheeky (semantic)... should probably be removed
		"꧂": "꧁",
		"꭫": "꭪",
		"﴿": "﴾",
		"﹚": "﹙",
		"﹜": "﹛",
		"﹞": "﹝",
		"）": "（",
		"］": "［",
		"｝": "｛",
		"｠": "｟",
		"￫": "￩",
		"𐡸": "𐡷",
		"𛱲": "𛱰",
		"𝄇": "𝄆",
		"𝅌": "𝅊",
		"𝅍": "𝅋",
		"🔎": "🔍",
		"🕄": "🕃",
		"🕽": "🕻",
		"✎": "🖉",
		"🖙": "🖘",
		"🖛": "🖚",
		"🖝": "🖜",
		"🗧": "🗦",
		"🗩": "🗨",
		"🗭": "🗬",
		"🗯": "🗮",
		"🙮": "🙬",
		"🞂": "🞀",
		"🠂": "🠀",
		"🠆": "🠄",
		"🠊": "🠈",
		"🠒": "🠐",
		"🠖": "🠔",
		"🠚": "🠘",
		"🠞": "🠜",
		"🠢": "🠠",
		"🠦": "🠤",
		"🠪": "🠨",
		"🠮": "🠬",
		"🠲": "🠰",
		"🠶": "🠴",
		"🠺": "🠸",
		"🠾": "🠼",
		"🡂": "🡀",
		"🡆": "🡄",
		"🡒": "🡐",
		"🡢": "🡠",
		"🡪": "🡨",
		"🡲": "🡰",
		"🡺": "🡸",
		"🢂": "🢀",
		"🢒": "🢐",
		"🢖": "🢔",
		"🢚": "🢘",
		"🢣": "🢢",
		"🢩": "🢨",
		"🢫": "🢪",
		"🢦": "🢧",
		"🢧": "🢦",
		"🡔": "🡕",
		"🡖": "🡗",
		"🡤": "🡥",
		"🡦": "🡧",
		"🡕": "🡔",
		"🡗": "🡖",
		"🡥": "🡤",
		"🡧": "🡦",
		"⇄": "⇆",
		"⇆": "⇄",
		"⇋": "⇌",
		"⇌": "⇋",
		"⎰": "⎱",
		"⎱": "⎰",
		"⤸": "⤹",
		"⤹": "⤸",
		"⤾": "⤿",
		"⤿": "⤾",
		"⥂": "⥃",
		"⥃": "⥂",
		"⥌": "⥍",
		"⥍": "⥌",
		"⥏": "⥑",
		"⥑": "⥏",
		"⥦": "⥨",
		"⥧": "⥩",
		"⥨": "⥦",
		"⥩": "⥧",
		"⮀": "⮂",
		"⮂": "⮀",
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
	const acceptedOneWayFlips = [
		"Q", "a", "Ֆ", "𐒈", "₰", "y", "ↄ", "Ɜ", "𝼃"
	];
	// #endregion

	// #region sanity checks
	const duplicatesInSymmetricalGlyphs = findDuplicates(symmetricalGlyphs);
	if (duplicatesInSymmetricalGlyphs.length > 0) {
		console.log("Duplicates in symmetricalGlyphs:", duplicatesInSymmetricalGlyphs);
	}
	const duplicatesInAcceptedOneWayFlips = findDuplicates(acceptedOneWayFlips);
	if (duplicatesInAcceptedOneWayFlips.length > 0) {
		console.log("Duplicates in acceptedOneWayFlips:", duplicatesInAcceptedOneWayFlips);
	}
	// detect one-way flips
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
		console.groupCollapsed("To accept");
		console.log("Add these to acceptedOneWayFlips:", unacceptedOneWayFlips.map((array) => array[0]));
		console.groupEnd();
		console.groupCollapsed("To add as mirrors");
		console.log("Add these to unicodeMirrorCharacters:", JSON.stringify(
			Object.fromEntries(
				unacceptedOneWayFlips.map((array) => [array[1], array[0]])
			),
			null, "\t"
		));
		console.log("Note that some may be already in unicodeMirrorCharacters. You should use `npm run lint` to check for duplicate keys.");
		console.groupEnd();
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
	// detect redundant mappings that are same between ASCII and Unicode
	const redundantMappings = [];
	for (const grapheme of allKeys) {
		if (asciiMirrorCharacters[grapheme] === unicodeMirrorCharacters[grapheme]) {
			redundantMappings.push(grapheme);
		}
	}
	if (redundantMappings.length > 0) {
		console.log("There are redundant mappings that are same between ASCII and Unicode:", redundantMappings);
	}

	// #endregion

	function flipGrapheme(grapheme, asciiOnly) {
		if (grapheme in unicodeMirrorCharacters && !asciiOnly) {
			return unicodeMirrorCharacters[grapheme];
		} else if (grapheme in asciiMirrorCharacters) {
			return asciiMirrorCharacters[grapheme];
		} else {
			return grapheme;
		}
	}

	// #region mirror search

	// TODO: use shape contexts as attributes for a weighted bipartite matching problem
	function searchForMirrorsWithVisualMatching(searchGlyphs) {
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
				if (unicodeMirrorCharacters[glyph1] || asciiMirrorCharacters[glyph2]) {
					console.log("Already has some mirrors, skipping:", glyph1, glyph2);
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

	async function searchForMirrorsInUnicodeData() {
		// https://www.unicode.org/Public/14.0.0/ucd/UnicodeData.txt
		const unicodeData = await (await fetch("unicode/UnicodeData-14.0.0.txt")).text();
		const lines = unicodeData.split(/\r?\n/).filter((line) => line.length > 0);
		const characterDefinitions = lines.map((line) => {
			// const [codePoint, name, generalCategory, canonicalCombiningClass, bidiClass, decompositionMapping, numericValue, numericValueRadix, numericValueDigits, numericValueNumerator, numericValueDenominator, bidiMirrored, unicode1Name, isoComment, simpleUppercaseMapping, simpleLowercaseMapping, simpleTitlecaseMapping] = line.split(";");
			const [codePoint, name] = line.split(";");
			if (!name) {
				console.warn("Invalid line:", line);
			}
			return {
				codePoint: parseInt(codePoint, 16),
				name,
				// generalCategory,
				// canonicalCombiningClass,
				// bidiClass,
				// decompositionMapping,
				// numericValue: numericValue && parseInt(numericValue, 16),
				// numericValueRadix: numericValueRadix && parseInt(numericValueRadix, 16),
				// numericValueDigits: numericValueDigits && parseInt(numericValueDigits, 16),
				// numericValueNumerator: numericValueNumerator && parseInt(numericValueNumerator, 16),
				// numericValueDenominator: numericValueDenominator && parseInt(numericValueDenominator, 16),
				// bidiMirrored: bidiMirrored === "Y",
				// unicode1Name,
				// isoComment,
				// simpleUppercaseMapping,
				// simpleLowercaseMapping,
				// simpleTitlecaseMapping,
			};
		});
		const pairs = [];
		const notFound = [];
		for (const characterDefinition of characterDefinitions) {
			const glyph = String.fromCodePoint(characterDefinition.codePoint);
			if (glyph in unicodeMirrorCharacters || glyph in asciiMirrorCharacters) {
				console.log("Already in mirror map, skipping:", glyph);
				continue;
			}
			let oppositeName;
			if (characterDefinition.name.includes("REVERSE")) {
				oppositeName = characterDefinition.name.replace(/(\s*)REVERSED?\s*/, "$1");
				// TODO: combine with other replacements,
				// e.g. for ⭁ U+2B41 REVERSE TILDE OPERATOR ABOVE LEFTWARDS ARROW
			} else if (characterDefinition.name.match(/LEFT|RIGHT|CLOCKWISE/)) {
				// replacements are combined here, to get matches for e.g.
				// 2938;RIGHT-SIDE ARC CLOCKWISE ARROW;Sm;0;ON;;;;;N;;;;;
				// 2939;LEFT-SIDE ARC ANTICLOCKWISE ARROW;Sm;0;ON;;;;;N;;;;;
				oppositeName = characterDefinition.name.replace(/LEFT|RIGHT|(?:ANTI)?CLOCKWISE/g, (match) => {
					return {
						"LEFT": "RIGHT",
						"RIGHT": "LEFT",
						"CLOCKWISE": "ANTICLOCKWISE",
						"ANTICLOCKWISE": "CLOCKWISE",
					}[match];
				});
			} else {
				continue;
			}
			let pair;
			for (const otherDefinition of characterDefinitions) {
				if (otherDefinition.name === oppositeName) {
					pair = [characterDefinition, otherDefinition];
					break;
				}
			}
			if (pair) {
				pairs.push(pair);
			} else {
				notFound.push(characterDefinition);
			}
		}
		console.log("Found", pairs.length, "new pairs of possible mirror characters:", JSON.stringify(Object.fromEntries(pairs.map((pair) =>
			pair.map(({ codePoint }) => String.fromCodePoint(codePoint))
		)), null, "\t"));
		console.log("Details for new possible mirror characters:\n", (pairs.map((pair) =>
			pair.map(({ codePoint }) => String.fromCodePoint(codePoint)).join(" ↔ ") + "\n" +
			pair.map(({ codePoint, name }) => `${String.fromCodePoint(codePoint)} (${name})`).join("\n")
		)).join("\n\n"));

		console.log("Didn't find matching pairs for:", notFound);
	}

	// (TODO: This is more of a sanity check, maybe should move into other code region.)
	// (Or, shouldn't sanity checks be in the tests?)
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

	// #endregion

	window.flipText = flipText;
	flipText.parseText = parseText;
	flipText.visualizeParse = visualizeParse;
	flipText.blockifyText = blockifyText;
	flipText.searchForMirrorsWithVisualMatching = searchForMirrorsWithVisualMatching;
	flipText.searchForMirrorsInUnicodeData = searchForMirrorsInUnicodeData;
	flipText.detectMissingMirrors = detectMissingMirrors;

	// console.log(searchForMirrorsWithVisualMatching("AB{}[]()<>"));
	// console.log(searchForMirrorsWithVisualMatching("▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟"));
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
	// searchForMirrorsWithVisualMatching(symbolsForLegacyComputing);
	// detectMissingMirrors(symbolsForLegacyComputing);
	// searchForMirrorsWithVisualMatching(geometricShapes);
	// detectMissingMirrors(geometricShapes);
	detectMissingMirrors("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");

})();
