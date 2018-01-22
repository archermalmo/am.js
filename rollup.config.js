import babel from "rollup-plugin-babel";
import minify from "rollup-plugin-minify-es";
import ts from "rollup-plugin-typescript2";

const { NODE_ENV } = process.env;

export default [
	{
		input: "src/index.ts",
		plugins: [ts(), babel(), NODE_ENV === "production" && minify()],
		output: [
			{
				file: "demo/am.js",
				format: "iife",
				name: "AM"
			},
			{
				file: "dist/am.js",
				format: "iife",
				name: "AM"
			},
			{
				file: "dist/am.esm.js",
				format: "es"
			},
			{
				file: "dist/am.cjs.js",
				format: "cjs"
			}
		]
	},
	{
		input: "src/index.ts",
		plugins: [ts(), babel()],
		output: [
			{
				file: "demo/am.dev.js",
				format: "iife",
				name: "AM",
				sourcemap: "inline"
			},
			{
				file: "dist/am.dev.js",
				format: "iife",
				name: "AM",
				sourcemap: "inline"
			},
			{
				file: "dist/am.esm.dev.js",
				format: "es",
				sourcemap: "inline"
			},
			{
				file: "dist/am.cjs.dev.js",
				format: "cjs",
				sourcemap: "inline"
			}
		]
	}
];
