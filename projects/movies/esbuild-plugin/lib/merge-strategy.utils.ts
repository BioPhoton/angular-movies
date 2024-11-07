import { createHash } from 'crypto';
import { Metafile } from 'esbuild';

import { OutputPath, importsInEntryPoint } from './esbuild.utils';

export type MergeKey = string;
export type MergeStrategyMap = Map<MergeKey, OutputPath[]>;
export type MergeStrategyLookup = Map<OutputPath, MergeKey>;
export type MergeStrategyReverseLookup = Map<OutputPath, OutputPath[]>;

export function getStrategyLookup(entryPoint: OutputPath, metafile: Metafile, maxBins: number) {
    const strategy = getMergeStrategyMap(entryPoint, metafile, maxBins);
    const lookup: MergeStrategyLookup = new Map([...strategy].flatMap(([key, values]) => values.map((value) => [value, key])));
    const reverseLookup: MergeStrategyReverseLookup = new Map([...lookup].map(([key, value]) => [key, strategy.get(value)!]));
    return { lookup, reverseLookup };
}

function getMergeStrategyMap(entryPoint: OutputPath, { outputs }: Metafile, maxBins: number): MergeStrategyMap {
    const initialChunkStrategy = mergeStrategy(entryPoint, outputs, maxBins);
    const mergedChunkGroups = [...initialChunkStrategy.values()];
    const mergedChunks = new Set(mergedChunkGroups.flat());
    const notMergedChunks = Object.keys(outputs)
        .filter((chunkName) => !mergedChunks.has(chunkName))
        .map((chunkName) => [chunkName]);

    return new Map([...mergedChunkGroups, ...notMergedChunks].map((values) => [hashFromOutputPaths(values), values]));
}

function mergeStrategy(entryPoint: OutputPath, metafileOutputs: Metafile['outputs'], maxBins: number) {
    const initialChunks = importsInEntryPoint(entryPoint, metafileOutputs);

    const initialChunksGraph: { [key: string]: string[] } = {};
    for (const initialChunk of initialChunks) {
        initialChunksGraph[initialChunk] = metafileOutputs[initialChunk].imports
            .filter(({ kind, external }) => kind !== 'dynamic-import' && !external)
            .map(({ path }) => path);
    }

    const sortedChunks = topologicalSort(initialChunksGraph);
    const weights = new Map<OutputPath, number>(initialChunks.map((outputPath) => [outputPath, metafileOutputs[outputPath].bytes]));
    const mergeMap = new Map<OutputPath, MergeKey[]>(sortedChunks.map((chunk) => [chunk, [chunk]]));

    while (sortedChunks.length > maxBins) {
        const [x, y] = findMergeTargets(sortedChunks, weights);

        mergeMap.get(sortedChunks[x])!.push(...mergeMap.get(sortedChunks[y])!);
        mergeMap.delete(sortedChunks[y]);
        weights.set(sortedChunks[x], weights.get(sortedChunks[x])! + weights.get(sortedChunks[y])!);
        weights.delete(sortedChunks[y]);

        sortedChunks.splice(y, 1);
    }

    return mergeMap;
}

function topologicalSort(graph: { [key: string]: string[] }): string[] {
    const topologicalOrder: string[] = [];
    const visitedVertices: Set<string> = new Set();

    function depthFirstSearch(vertex: string): void {
        visitedVertices.add(vertex);

        for (const adjacentVertex of graph[vertex]) {
            if (!visitedVertices.has(adjacentVertex)) {
                depthFirstSearch(adjacentVertex);
            }
        }

        topologicalOrder.push(vertex);
    }

    for (const vertex in graph) {
        if (!visitedVertices.has(vertex)) {
            depthFirstSearch(vertex);
        }
    }

    return topologicalOrder.reverse();
}

function findMergeTargets(sortedChunks: OutputPath[], weights: Map<OutputPath, number>): [number, number] {
    let candidateWeight = Infinity;
    let candidateIndex = 0;
    for (let i = 0; i < sortedChunks.length - 1; i++) {
        const mergedWeight = weights.get(sortedChunks[i])! + weights.get(sortedChunks[i + 1])!;
        if (mergedWeight < candidateWeight) {
            candidateWeight = mergedWeight;
            candidateIndex = i;
        }
    }
    return [candidateIndex, candidateIndex + 1];
}

function hashFromOutputPaths(paths: string[]): MergeKey {
    return createHash('sha256').update(paths.join('')).digest('hex').substring(0, 8).toUpperCase();
}
