import { Plugin } from 'esbuild';
import { getAppEntryPoint } from "./lib/esbuild.utils";
import { rollupReBundle } from "./lib/rollup.utils";
import { rollupToEsbuildOutputs } from "./lib/bundle-adaptor.utils";
import { getStrategyLookup } from "./lib/merge-strategy.utils";

export default function optimizeChunksPlugin(options: { main?: string, maxChunks?: number } = {}): Plugin {
    const { maxChunks = 6 } = options;
    return {
        name: 'optimize-bundle',
        setup({ onEnd, initialOptions }) {
            onEnd(async (result) => {
                if (initialOptions.define?.['ngDevMod'] === 'true') {
                    return; // Bail out of optimization on dev build or serve
                }
                if (initialOptions.platform === 'node') {
                  return; // Bail out of optimization on server build
                }
                if (!result.metafile) {
                    throw new Error('Unable to extract metafile from esbuild plugin');
                }
                if (!result.outputFiles) {
                    throw new Error('Unable to extract outputFiles in esbuild plugin');
                }

                const entryChunk = getAppEntryPoint(initialOptions, result.metafile);
                const { lookup, reverseLookup } = getStrategyLookup(entryChunk, result.metafile, maxChunks);
                const reBundledOutput = await rollupReBundle(entryChunk, result.outputFiles, initialOptions, lookup);
                const { newMetafileOutputs, newOutputFiles } = rollupToEsbuildOutputs(reBundledOutput, result.metafile, reverseLookup);

                result.metafile.outputs = newMetafileOutputs;
                result.outputFiles = newOutputFiles;
            });
        },
    };
}
