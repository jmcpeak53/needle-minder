const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

function escapeForRegex(filePath) {
  return filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const opencodePathPattern = escapeForRegex(path.resolve(__dirname, ".opencode")).replaceAll(
  "\\\\",
  "[\\\\/]"
);

const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList];
const opencodeBlockList = new RegExp(`^${opencodePathPattern}([\\\\/].*)?$`);

config.resolver.blockList = new RegExp(
  `(${existingBlockList.map((pattern) => pattern.source).join("|")}|${opencodeBlockList.source})`
);

module.exports = config;
