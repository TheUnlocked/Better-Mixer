import ts from 'typescript';
import fs from 'fs';

type PluginOptions = {
    target?: string;
};

export default (program: ts.Program, pluginOptions: PluginOptions) => (ctx: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
        if (ts.isCallExpression(node)) {
            if (node.expression.getText() === "__COMPILER_INLINE") {
                const args = node.arguments;
                if (args.length === 0) {
                    throw new Error("The first argument to __COMPILER_INLINE must be a compile-time string");
                }
                const typeNode = args[0];
                if (ts.isStringLiteralLike(typeNode)) {
                    switch (typeNode.text) {
                        case "target": {
                            return ts.createStringLiteral(pluginOptions.target ?? "extension");
                        }
                        case "stylesheet": {
                            const fileNode = args[1];
                            if (ts.isStringLiteralLike(fileNode)) {
                                if (pluginOptions.target === "script") {
                                    return ts.createStringLiteral(fs.readFileSync(`Extension/${fileNode.text}`).toString().replace(/\r/g, ''));
                                }
                                return fileNode;
                            }
                            throw new Error(`The argument to __COMPILER_INLINE('stylesheet', source) must be a string literal`);
                        }
                        default:
                            throw new Error(`${typeNode.getFullText()} is not a valid inline type for __COMPILER_INLINE`);
                    }
                }
                else {
                    throw new Error("The first argument to __COMPILER_INLINE must be a string literal");
                }
            }
        }

        return ts.visitEachChild(node, visitor, ctx);
    };
    return ts.visitEachChild(sourceFile, visitor, ctx);
};