const left = document.getElementById("left");
const right = document.getElementById("right");
left.oninput = function () {
	right.value = flipText(left.value);
};
right.oninput = function () {
	left.value = flipText(right.value);
};
if (left.value.trim()) {
	left.oninput();
} else {
	right.oninput();
}