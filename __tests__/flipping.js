/* global it, expect, require, flipText, global */
"use strict";

const GraphemeSplitter = require("../grapheme-splitter");
global.GraphemeSplitter = GraphemeSplitter;
require("../flip-text-art");

it("should flip brackets", () => {
	expect(flipText("({[<")).toBe(">]})");
	expect(flipText(">]})")).toBe("({[<");
});

it("should preserve spaces with trimSpaces = false", () => {
	expect(flipText("   o", false, false, false)).toBe("o   ");
	expect(flipText("o   ", false, false, false)).toBe("   o");
});

it("should flip Tinker Toys figlet font ASCII art", () => {
	const input = `
 o-o               o        o--o          o    o
o                  |        |   |         |    |
|  -o o-o  oo o-o  O--o     O--o  o-o o-o O-o  | o-o o-O-o
o   | |   | | |  | |  |     |     |   | | |  | | |-* | | |
 o-o  o   o-o-O-o  o  o     o     o   o-o o-o  o o-o o o o
              |
              o
`;
	const expected = `
          o    o          o--o        o               o-o
          |    |         |   |        |                  o
o-O-o o-o |  o-O o-o o-o  o--O     o--O  o-o oo  o-o o-  |
| | | *-| | |  | | |   |     |     |  | |  | | |   | |   o
o o o o-o o  o-o o-o   o     o     o  o  o-O-o-o   o  o-o
                                           |
                                           o
`;
	expect(flipText(input)).toBe(expected);
});

it("should un-flip Tinker Toys figlet font ASCII art", () => {
	const input = `
          o    o          o--o        o               o-o
          |    |         |   |        |                  o
o-O-o o-o |  o-O o-o o-o  o--O     o--O  o-o oo  o-o o-  |
| | | *-| | |  | | |   |     |     |  | |  | | |   | |   o
o o o o-o o  o-o o-o   o     o     o  o  o-O-o-o   o  o-o
                                           |
                                           o
`;
	const expected = `
 o-o               o        o--o          o    o
o                  |        |   |         |    |
|  -o o-o  oo o-o  O--o     O--o  o-o o-o O-o  | o-o o-O-o
o   | |   | | |  | |  |     |     |   | | |  | | |-* | | |
 o-o  o   o-o-O-o  o  o     o     o   o-o o-o  o o-o o o o
              |
              o
`;
	expect(flipText(input)).toBe(expected);
});
