/* global flipText */
const left = document.getElementById("left");
const right = document.getElementById("right");
const asciiOnly = document.getElementById("ascii-only");
const preserveWords = document.getElementById("preserve-words");
const trimLines = document.getElementById("trim-lines");
let input, output;
function update() {
	output.value = flipText(input.value, asciiOnly.checked, preserveWords.checked, trimLines.checked);
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
let tid;
trimLines.onchange = function () {
	clearTimeout(tid);
	update();
	output.style.textDecoration = "underline rgb(255, 142, 137) 0.2em";
	tid = setTimeout(() => {
		output.style.textDecoration = "";
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
