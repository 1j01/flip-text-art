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
		// TODO: show code points because it's hard to see some characters
		// Also, include reverse mappings in the output
		// Also, what's up with this note about duplicate keys?
		// When is that a problem, and is it preventable, or does it require consideration when it occurs?
		const newMappings = Object.fromEntries(
			unacceptedOneWayFlips.map((array) => [array[1], array[0]])
		);
		const unacceptedRepresentation = unacceptedOneWayFlips.map((array) =>
			array.join(" ⟶ ")
		).join("\n  ");
		throw new Error(`There are one-way flips that have not been accepted:
  ${unacceptedRepresentation}

To accept:
  Add these to acceptedOneWayFlips: ${JSON.stringify(unacceptedOneWayFlips.map((array) => array[0]))}

To add as mirrors:
  Add these to unicodeMirrorCharacters: ${JSON.stringify(newMappings, null, "\t").replace(/\n/g, "\n  ")}
  Note that some may be already in unicodeMirrorCharacters. You should use \`npm run lint\` to check for duplicate keys.`);

	}
});

it("should not have accepted one-way flips that are not one-way", () => {
	const acceptedOneWayFlipsNotOneWay = [];
	for (const accepted of acceptedOneWayFlips) {
		if (flipGrapheme(flipGrapheme(accepted)) === accepted) {
			acceptedOneWayFlipsNotOneWay.push([accepted, flipGrapheme(accepted), flipGrapheme(flipGrapheme(accepted))]);
		}
	}
	if (acceptedOneWayFlipsNotOneWay.length > 0) {
		const arrowLines = acceptedOneWayFlipsNotOneWay.map((array) =>
			array.join(" ⟶ ")
		);
		throw new Error(`There are accepted one-way flips that are not one-way:
  ${arrowLines.join("\n  ")}`);
	}
});

it("should not have mappings that won't apply because the text won't be split at that boundary", () => {
	const unapplicableMappings = [];
	for (const grapheme of allKeys) {
		if (!splitter.splitGraphemes(`Test${grapheme}Test`).includes(grapheme)) {
			unapplicableMappings.push(grapheme);
		} else if (`<${flipGrapheme(grapheme)}>` !== flipText(`<${grapheme}>`)) {
			throw new Error("How did this happen? splitGraphemes gives the key, but flipText doesn't give the same result?");
		}
	}
	expect(unapplicableMappings).toEqual([]);
});

it("should not have redundant mappings that are same between ASCII and Unicode", () => {
	const redundantMappings = [];
	for (const grapheme of allKeys) {
		if (asciiMirrorCharacters[grapheme] === unicodeMirrorCharacters[grapheme]) {
			redundantMappings.push(grapheme);
		}
	}
	expect(redundantMappings).toEqual([]);
});
