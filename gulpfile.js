/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
const { src, dest, parallel, series, watch } = require("gulp");

const assets = ["Extension/lib/css/*.css", "Extension/Icons/*.png", "Extension/manifest.json"];

function copyAssets() {
    return src(assets, { base: "./Extension/" }).pipe(dest("build"));
}

function createBuildTask() {
    return parallel(copyAssets);
}

function assetsWatch() {
    return watch(assets, copyAssets);
}

exports.assets = copyAssets;
exports.watch = series(createBuildTask(), parallel(assetsWatch));

exports.default = createBuildTask();
