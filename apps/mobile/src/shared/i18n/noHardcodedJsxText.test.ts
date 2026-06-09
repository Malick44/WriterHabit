/// <reference types="node" />

import * as fs from "fs";
import * as path from "path";

const appRoot = path.resolve(__dirname, "../../..");
const scanRoots = [path.join(appRoot, "src"), path.join(appRoot, "app")];
const userFacingPropNames = [
  "accessibilityHint",
  "accessibilityLabel",
  "actionLabel",
  "buttonText",
  "description",
  "emptyDescription",
  "emptyTitle",
  "errorTitle",
  "helperText",
  "hint",
  "label",
  "placeholder",
  "primaryActionLabel",
  "secondaryActionLabel",
  "subtitle",
  "successTitle",
  "title",
] as const;

function collectTsxFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath);
    }

    if (!entry.isFile() || !entry.name.endsWith(".tsx") || entry.name.includes(".test.")) {
      return [];
    }

    return [fullPath];
  });
}

function lineNumberForIndex(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

describe("localized JSX copy", () => {
  it("does not hardcode visible JSX strings", () => {
    const violations = scanRoots.flatMap(collectTsxFiles).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      const relativePath = path.relative(appRoot, filePath);
      const found: string[] = [];
      const directTextPattern = /<Text\b[^>]*>\s*([A-Za-z][^<{]*?)\s*<\/Text>/g;
      const propPattern = new RegExp(
        `\\b(${userFacingPropNames.join("|")})\\s*=\\s*"([^"{]*[A-Za-z][^"]*)"`,
        "g",
      );

      for (const match of source.matchAll(directTextPattern)) {
        found.push(`${relativePath}:${lineNumberForIndex(source, match.index ?? 0)} direct <Text> copy`);
      }

      for (const match of source.matchAll(propPattern)) {
        found.push(`${relativePath}:${lineNumberForIndex(source, match.index ?? 0)} ${match[1]}="${match[2]}"`);
      }

      return found;
    });

    expect(violations).toEqual([]);
  });
});
