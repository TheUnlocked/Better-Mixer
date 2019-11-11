/* eslint-disable no-undef */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
const { src, dest, parallel, series, watch } = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");

const tsProject = ts.createProject("tsconfig.json");

const assets = ["Extension/lib/css/*.css", "Extension/Icons/*.png", "Extension/manifest.json"];
const scriptPaths = {
    ts: "Extension/**/*.ts",
    js: "Extension/**/*.js",
};

function copyAssets() {
    return src(assets, { base: "./Extension/" }).pipe(dest("build"));
}

function buildTypescript() {
    return src(scriptPaths.ts, { base: "./Extension/" })
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write())
        .pipe(dest("build"));
}

function copyJavascript() {
    return src(scriptPaths.js, { base: "./Extension/" }).pipe(dest("build"));
}

function createBuildTask() {
    return parallel(copyAssets, copyJavascript, buildTypescript);
}

function tsWatch() {
    return watch(scriptPaths.ts, buildTypescript);
}

function jsWatch() {
    return watch(scriptPaths.js, copyJavascript);
}

function assetsWatch() {
    return watch(assets, copyAssets);
}

exports.assets = copyAssets;
exports.tsFiles = buildTypescript;
exports.watch = series(createBuildTask(), parallel(tsWatch, jsWatch, assetsWatch));

exports.default = createBuildTask();
