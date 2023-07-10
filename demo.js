/* global flipText */
const left = document.getElementById("left");
const right = document.getElementById("right");
const bottom = document.getElementById("bottom");
const asciiOnly = document.getElementById("ascii-only");
const preserveWords = document.getElementById("preserve-words");
const trimLines = document.getElementById("trim-lines");
const visualize = document.getElementById("visualize");
const syncScroll = document.getElementById("sync-scroll");
let input, output;
let overlays = [];
function update() {
	output.value = flipText(input.value, {
		asciiOnly: asciiOnly.checked,
		preserveWords: preserveWords.checked,
		trimLines: trimLines.checked,
	});
	const inputLines = flipText.blockifyText(input.value).split(/\r?\n/);
	const outputLines = output.value.split(/\r?\n/);
	const joinedLines = [];
	for (let i = 0; i < Math.max(inputLines.length, outputLines.length); i++) {
		const inputLine = inputLines[i] || "";
		const outputLine = outputLines[i] || "";
		joinedLines.push(inputLine + "  " + outputLine);
	}
	bottom.value = joinedLines.join("\n");
	for (const overlay of overlays) {
		overlay._cleanup();
		overlay.remove();
	}
	overlays = [];
	let isProgrammaticScroll = false;
	for (const textarea of [left, right]) {
		if (textarea._cleanupScrollSync) {
			textarea._cleanupScrollSync();
		}
		if (syncScroll.checked) {
			const onScroll = (e) => {
				// console.log(textarea.id, e, e?.isTrusted, isProgrammaticScroll);
				if (isProgrammaticScroll) {
					return;
				}
				const other = textarea === left ? right : left;
				isProgrammaticScroll = true;
				other.scrollTop = textarea.scrollTop;
				// other.scrollLeft = textarea.scrollLeft;
				// mirror scroll position
				other.scrollLeft = textarea.scrollWidth - textarea.clientWidth - textarea.scrollLeft;
				setTimeout(() => {
					isProgrammaticScroll = false;
				}, 0);
			};
			textarea.addEventListener("scroll", onScroll);
			onScroll();
			textarea._cleanupScrollSync = () => {
				textarea.removeEventListener("scroll", onScroll);
			};
		}
	}
	if (!visualize.checked) {
		return;
	}
	// Showing overlays for all textareas might be confusing,
	// if it's re-parsing the output, rather than using a transformed structure of the input for the outputs.
	// for (const textarea of [left, right, bottom]) {
	for (const textarea of [input]) {
		const overlay = flipText.visualizeParse(flipText.parseText(textarea.value, {
			preserveWords: preserveWords.checked,
		}));
		overlay.classList.add("textarea-overlay");
		textarea.parentNode.appendChild(overlay);
		overlays.push(overlay);
		const onScroll = () => {
			overlay.style.top = -textarea.scrollTop + "px";
			overlay.style.left = -textarea.scrollLeft + "px";
		};
		textarea.addEventListener("scroll", onScroll);
		onScroll();
		overlay._cleanup = () => {
			textarea.removeEventListener("scroll", onScroll);
		};
	}
}
left.oninput = function () {
	input = left;
	output = right;
	update();
};
right.oninput = function () {
	input = right;
	output = left;
	update();
};
asciiOnly.onchange = update;
preserveWords.onchange = update;
visualize.onchange = update;
syncScroll.onchange = update;
let tid;
trimLines.onchange = function () {
	clearTimeout(tid);
	update();
	output.style.textDecoration = "underline rgb(255, 142, 137) 0.2em";
	bottom.style.textDecoration = "underline rgb(255, 142, 137) 0.2em";
	tid = setTimeout(() => {
		output.style.textDecoration = "";
		bottom.style.textDecoration = "";
	}, 1000);
};
if (left.value.trim()) {
	input = left;
	output = right;
} else {
	input = right;
	output = left;
}
update();
