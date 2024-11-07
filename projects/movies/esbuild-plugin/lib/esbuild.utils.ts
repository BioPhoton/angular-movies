import { BuildOptions, Metafile, OutputFile } from 'esbuild';
import { posix, sep } from 'node:path';

export type OutputPath = keyof Metafile['outputs'];

export function getAppEntryPoint({ absWorkingDir, entryPoints }: BuildOptions, { outputs }: Metafile) {
    const entryFileName = pathToFileName(absWorkingDir, getEntryPointPath(entryPoints));
    const chunkName = getChunkNameByEntryPoint(entryFileName, outputs);

    if (!chunkName) {
        throw new Error('Could not find chunkName for entry file ' + entryFileName);
    }

    return chunkName;
}

export function importsInEntryPoint(entryPoint: OutputPath, metaFileOutputs: Metafile['outputs'], traversedImports = [entryPoint]): OutputPath[] {
    const staticImports = metaFileOutputs[entryPoint].imports.filter(
        ({ kind, path, external }) => kind !== 'dynamic-import' && !traversedImports.includes(path) && !external,
    );

    if (!staticImports.length) {
        return traversedImports;
    }

    return staticImports.flatMap(({ path }) => importsInEntryPoint(path, metaFileOutputs, [...traversedImports, path]));
}

function getChunkNameByEntryPoint(entryPoint: string, metafileOutputs: Metafile['outputs']): string | undefined {
    return Object.keys(metafileOutputs).find((name) => metafileOutputs[name].entryPoint === entryPoint);
}

export function pathToFileName(absWorkingDir: BuildOptions['absWorkingDir'], path: OutputFile['path']): string {
    return path.replace(absWorkingDir + sep, '').replaceAll(sep, posix.sep);
}

function getEntryPointPath(entryPoints: BuildOptions['entryPoints']): string {
    if (!entryPoints) {
        throw new Error('Could not extract entryPoints for entryPoints as its undefined');
    }
    if (Array.isArray(entryPoints)) {
        if (entryPoints.length > 1) {
            throw new Error('We currently do not support multiple entry points, if you are interested in this feature please open an issue');
        }
        if (!entryPoints.length) {
            throw new Error('Entry points seems to be an array bug has no entries');
        }
        const entryPoint = entryPoints[0];
        if (typeof entryPoint === 'string') {
            return entryPoint;
        }
        return entryPoint.in;
    }
    if (typeof entryPoints === 'object' && 'main' in entryPoints) {
        return entryPoints['main'];
    }
    throw new Error('Could not extract entryPoints please pass it as an option to the plugin');
}
