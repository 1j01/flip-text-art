/* global it, expect, require, flipText, global */
"use strict";

const GraphemeSplitter = require("../grapheme-splitter");
global.GraphemeSplitter = GraphemeSplitter;
require("../flip-text-art");

it("should flip brackets", () => {
	expect(flipText("({[<")).toBe(">]})");
	expect(flipText(">]})")).toBe("({[<");
});

it("should preserve spaces with trimLines = false", () => {
	expect(flipText("   o", { trimLines: false })).toBe("o   ");
	expect(flipText("o   ", { trimLines: false })).toBe("   o");
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

it("should preserve words with preserveWords = true", () => {
	expect(flipText("hello world", { preserveWords: true })).toBe("hello world");
	expect(flipText("<--this way---", { preserveWords: true })).toBe("---this way-->");
	expect(flipText("<--ഈ വഴിയേ---", { preserveWords: true })).toBe("---ഈ വഴിയേ-->");
	expect(flipText("<--這邊走--{", { preserveWords: true })).toBe("}--這邊走-->");
});

it("should mirror words with preserveWords = false", () => {
	expect(flipText("Here is a test!", { preserveWords: false })).toBe("!ɈƨɘɈ ɒ ƨi ɘɿɘH");
	expect(flipText("Do you like it?", { preserveWords: false })).toBe("⸮Ɉi ɘʞil υoγ oᗡ");
});

it("should mirror Unicode box drawing characters", () => {
	expect(flipText(`
┌─┬┐  ╔═╦╗  ╓─╥╖  ╒═╤╕
│ ││  ║ ║║  ║ ║║  │ ││
├─┼┤  ╠═╬╣  ╟─╫╢  ╞═╪╡
└─┴┘  ╚═╩╝  ╙─╨╜  ╘═╧╛
┌───────────────────┐
│  ╔═══╗ Some Text  │▒
│  ╚═╦═╝ in the box │▒
╞═╤══╩══╤═══════════╡▒
│ ├──┬──┤           │▒
│ └──┴──┘           │▒
└───────────────────┘▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
`)).toBe(`
╒╤═╕  ╓╥─╖  ╔╦═╗  ┌┬─┐
││ │  ║║ ║  ║║ ║  ││ │
╞╪═╡  ╟╫─╢  ╠╬═╣  ├┼─┤
╘╧═╛  ╙╨─╜  ╚╩═╝  └┴─┘
 ┌───────────────────┐
▒│  Some Text ╔═══╗  │
▒│ in the box ╚═╦═╝  │
▒╞═══════════╤══╩══╤═╡
▒│           ├──┬──┤ │
▒│           └──┴──┘ │
▒└───────────────────┘
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
`);
});
