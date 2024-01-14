/* global it, expect, require, flipText, global */
"use strict";

const GraphemeSplitter = require("../grapheme-splitter");
global.GraphemeSplitter = GraphemeSplitter;
require("../flip-text-art");
const {
	unicodeMirrorCharacters,
	asciiMirrorCharacters,
	symmetricalGlyphs,
	acceptedOneWayFlips,
	// nonMirrors,
	flipGrapheme,
	splitter,
} = flipText._private;
const allKeys = uniquify(Object.keys(asciiMirrorCharacters).concat(Object.keys(unicodeMirrorCharacters)));

function findDuplicates(array) {
	return array.filter((value, index, self) => self.indexOf(value) !== index);
}
function uniquify(array) {
	return Array.from(new Set(array));
}

// detect duplicates
it("should not have duplicates in symmetricalGlyphs", () => {
	const duplicatesInSymmetricalGlyphs = findDuplicates(symmetricalGlyphs);
	if (duplicatesInSymmetricalGlyphs.length > 0) {
		expect(duplicatesInSymmetricalGlyphs).toEqual([]);
	}
});
it("should not have duplicates in acceptedOneWayFlips", () => {
	const duplicatesInAcceptedOneWayFlips = findDuplicates(acceptedOneWayFlips);
	if (duplicatesInAcceptedOneWayFlips.length > 0) {
		expect(duplicatesInAcceptedOneWayFlips).toEqual([]);
	}
});

// detect one-way flips
it("should not have one-way flips (except accepted ones)", () => {
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
		// TODO: adapt to Jest
		// Also, show code points because it's hard to see some characters
		throw new Error("There are one-way flips that have not been accepted. See console for details.");
	}
});

// detect accepted one-way flips that are not one-way (keeping the acceptance list sensible)
it("should not have accepted one-way flips that are not one-way", () => {
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
});
// detect mappings that won't apply because the text won't be split at that boundary
it("should not have mappings that won't apply because the text won't be split at that boundary", () => {
	const unapplicableMappings = [];
	for (const grapheme of allKeys) {
		if (!splitter.splitGraphemes(`Test${grapheme}Test`).includes(grapheme)) {
			unapplicableMappings.push(grapheme);
		} else if (`<${flipGrapheme(grapheme)}>` !== flipText(`<${grapheme}>`)) {
			// console.warn("How did this happen? splitGraphemes gives the key, but flipText doesn't give the same result?");
			// unapplicableMappings.push(grapheme);
			throw new Error("How did this happen? splitGraphemes gives the key, but flipText doesn't give the same result?");
		}
	}
	// if (unapplicableMappings.length > 0) {
	// 	console.log("There are mappings that won't apply because the text won't be split at that boundary:", unapplicableMappings);
	// }
	expect(unapplicableMappings).toEqual([]);
});

// detect redundant mappings that are same between ASCII and Unicode
it("should not have redundant mappings that are same between ASCII and Unicode", () => {
	const redundantMappings = [];
	for (const grapheme of allKeys) {
		if (asciiMirrorCharacters[grapheme] === unicodeMirrorCharacters[grapheme]) {
			redundantMappings.push(grapheme);
		}
	}
	// if (redundantMappings.length > 0) {
	// 	console.log("There are redundant mappings that are same between ASCII and Unicode:", redundantMappings);
	// }
	expect(redundantMappings).toEqual([]);
});
