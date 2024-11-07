import { Metafile, OutputFile } from 'esbuild';
import { assert } from 'node:console';
import { OutputChunk, RollupOutput } from 'rollup';

import { MergeStrategyReverseLookup } from './merge-strategy.utils';

export function rollupToEsbuildOutputs(rollupOutput: RollupOutput['output'], { outputs }: Metafile, reverseLookup: MergeStrategyReverseLookup) {
    const newOutputFiles: OutputFile[] = [];
    const newMetafileOutputs: Metafile['outputs'] = {};
    rollupOutput
        .filter((output): output is OutputChunk => output.type === 'chunk')
        .forEach((output) => {
            const file = toEsbuildOutputFile(output.fileName, output.code);
            newOutputFiles.push(file);
            newMetafileOutputs[output.fileName] = {
                bytes: file.contents.length,
                imports: mergedImports(output.imports, output.dynamicImports),
                inputs: mergedInputs(Object.keys(output.modules).map((chunk) => outputs[chunk].inputs)),
                entryPoint: mergedEntryPoint(reverseLookup.get(output.facadeModuleId!)?.map((chunk) => outputs[chunk].entryPoint) ?? []),
                exports: output.exports,
            };
            if (output.map && output.sourcemapFileName) {
                const file = toEsbuildOutputFile(output.sourcemapFileName, output.map.toString());
                newOutputFiles.push(file);
                newMetafileOutputs[output.sourcemapFileName] = { imports: [], exports: [], inputs: {}, bytes: file.contents.length };
            }
        });
    return { newOutputFiles, newMetafileOutputs };
}

function mergedEntryPoint(mergeChunksEntryPoint: Metafile['outputs'][string]['entryPoint'][]): Metafile['outputs'][string]['entryPoint'] {
    const entryPoints = mergeChunksEntryPoint.filter(Boolean);
    assert(entryPoints.length <= 1, 'Warning merged chunk contained multiple entryPoints', entryPoints.length, entryPoints);
    return entryPoints[0];
}

function mergedImports(imports: string[], dynamicImports: string[]): Metafile['outputs'][string]['imports'] {
    return [
        imports.map((path): Metafile['outputs'][string]['imports'][number] => ({ path, kind: 'import-statement' })),
        dynamicImports.map((path): Metafile['outputs'][string]['imports'][number] => ({ path, kind: 'dynamic-import' })),
    ].flat();
}

function mergedInputs(mergedChunksInputs: Metafile['outputs'][string]['inputs'][]): Metafile['outputs'][string]['inputs'] {
    const inputs: Metafile['outputs'][string]['inputs'] = {};
    mergedChunksInputs.forEach((chunkInputs) => {
        Object.entries(chunkInputs).forEach(([key, value]) => {
            if (!Object.prototype.hasOwnProperty.call(inputs, key)) {
                inputs[key] = value;
            } else {
                inputs[key].bytesInOutput += value.bytesInOutput;
            }
        });
    });
    return inputs;
}

function toEsbuildOutputFile(filename: string, code: string): OutputFile {
    return {
        path: filename,
        contents: new TextEncoder().encode(code),
        hash: getHashFromFileName(filename),
        get text() {
            return new TextDecoder().decode(this.contents);
        },
    };
}

// Extracts the hash from the file name eg. chunk-3UZA2KDL.js -> 3UZA2KDL
function getHashFromFileName(name: string): string {
    return name.replace(/(\.js(\.map)?)$/, '').slice(-8);
}
