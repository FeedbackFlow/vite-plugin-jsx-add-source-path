import {parse} from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import {type Plugin} from 'vite'

const PLUGIN_NAME = `vite-plugin-jsx-add-source-path`
const FUNCTION_NAME = 'vitePluginJsxAddSourcePath'
const ATTRIBUTE_NAME = `data-source-path`
const CONFIG_REPO_NAME = 'repo'

interface Config {
    repo: string
    attribute?: string
}

export function vitePluginJsxAddSourcePath(config: Config): Plugin {
    if (!config.repo) {
        const errorMessage = `${PLUGIN_NAME}: Please provide '${CONFIG_REPO_NAME}' in the configuration object: ${FUNCTION_NAME}({ ${CONFIG_REPO_NAME}: '<directory>' })`
        throw new Error(errorMessage);
    }
    const actualAttributeName = config.attribute || ATTRIBUTE_NAME
    return {
        name: PLUGIN_NAME,
        enforce: 'pre',

        transform(src, id) {
            if (id.endsWith('.jsx') || id.endsWith('.tsx')) {
                const srcPath = id.split(config.repo).pop()?.slice(1)
                if (!srcPath) return
                const ast = parse(src, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx'],
                });

                traverse(ast, {
                    JSXOpeningElement(path) {
                        const existingProp = path.node.attributes.find(
                            // @ts-ignore
                            node => node.name && node.name.name === actualAttributeName
                        )
                        if (existingProp) return
                        const line = path.node.loc?.start.line
                        // column is 0-indexed https://github.com/babel/babel/issues/1106
                        const column = path.node.loc?.start.column
                        if(!line || !column) return;

                        path.node.attributes.push(
                            {
                                type: 'JSXAttribute',
                                name: {type: 'JSXIdentifier', name: actualAttributeName},
                                value: {type: 'StringLiteral', value: `${srcPath}:${line}:${column + 1}`}
                            }
                        );
                    }
                });

                const {code} = generate(ast);

                return {
                    code
                }
            }
        },
    }
}
