/* global flipText */
const left = document.getElementById("left");
const right = document.getElementById("right");
const asciiOnly = document.getElementById("ascii-only");
const preserveWords = document.getElementById("preserve-words");
const trimLines = document.getElementById("trim-lines");
let lastFn;
left.oninput = function () {
	right.value = flipText(left.value, asciiOnly.checked, preserveWords.checked, trimLines.checked);
	lastFn = left.oninput;
};
right.oninput = function () {
	left.value = flipText(right.value, asciiOnly.checked, preserveWords.checked, trimLines.checked);
	lastFn = right.oninput;
};
asciiOnly.onchange = function () {
	lastFn?.();
};
preserveWords.onchange = function () {
	lastFn?.();
};
trimLines.onchange = function () {
	lastFn?.();
};
if (left.value.trim()) {
	left.oninput();
} else {
	right.oninput();
}
