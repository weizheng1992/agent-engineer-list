import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the workspace root. Since Next.js is running inside context-engineering/,
// the parent directory is the root of the whole project containing docs, mini-cursor-agent, context-engineering etc.
const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

// Helper to determine if a file/dir should be ignored
function shouldIgnore(relativePath: string) {
  const ignored = [
    'node_modules',
    '.next',
    '.git',
    '.bun-cache',
    '.pnpm-store',
    '.superpowers',
    'tmp',
    'dist',
    'tsconfig.tsbuildinfo',
    'bun.lock',
    'package-lock.json',
  ];
  return ignored.some((p) => relativePath.split(path.sep).includes(p));
}

// Recursively scan files up to a certain depth
async function scanFiles(dir: string, currentDepth = 0, maxDepth = 4): Promise<any[]> {
  if (currentDepth > maxDepth) return [];

  let results: any[] = [];
  try {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const fullPath = path.join(dir, file.name);
      const relativePath = path.relative(WORKSPACE_ROOT, fullPath);

      if (shouldIgnore(relativePath)) {
        continue;
      }

      if (file.isDirectory()) {
        const subFiles = await scanFiles(fullPath, currentDepth + 1, maxDepth);
        results = results.concat(subFiles);
      } else {
        const stats = await fs.stat(fullPath);
        // Calculate importance score
        let score = 30; // base score
        const ext = path.extname(file.name);
        const name = file.name;

        if (name === 'package.json') score = 100;
        else if (name === 'schema.ts') score = 95;
        else if (name === 'page.tsx') score = 90;
        else if (name === 'route.ts') score = 85;
        else if (name === '.env') score = 80;
        else if (name === 'layout.tsx') score = 75;
        else if (ext === '.ts' || ext === '.tsx') score = 60;
        else if (ext === '.js' || ext === '.jsx') score = 55;
        else if (ext === '.md') score = 40;

        results.push({
          name: file.name,
          path: relativePath,
          size: stats.size,
          score,
          type: ext.substring(1) || 'text',
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }
  return results;
}

// AST Outline Parser function
function parseASTOutline(code: string) {
  const lines = code.split('\n');
  const items: any[] = [];

  // Robust patterns matching JS/TS syntax structures
  const importRegex = /^import\s+([\s\S]*?)\s+from\s+['"](.*?)['"]/;
  const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/;
  const arrowFuncRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>/;
  const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_]+)/;
  const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+([a-zA-Z0-9_]+)/;
  const schemaRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:pgTable|jsonSchema)/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ')) {
      const match = line.match(importRegex);
      if (match) {
        // clean up formatting in multi-line imports
        const cleanName = match[1].replace(/[\{\}\s\r\n]+/g, ' ').trim();
        items.push({
          type: 'import',
          name: cleanName,
          source: match[2],
          line: index + 1,
        });
      } else {
        items.push({
          type: 'import',
          name: trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : ''),
          line: index + 1,
        });
      }
    } else if (trimmed.includes('function ')) {
      const match = line.match(functionRegex);
      if (match) {
        items.push({
          type: 'function',
          name: match[1],
          params: match[2].trim(),
          line: index + 1,
        });
      }
    } else if (trimmed.includes('=>') && (trimmed.startsWith('const ') || trimmed.startsWith('export const '))) {
      const match = line.match(arrowFuncRegex);
      if (match) {
        items.push({
          type: 'arrow-function',
          name: match[1],
          params: match[2].trim(),
          line: index + 1,
        });
      }
    } else if (trimmed.startsWith('class ') || trimmed.startsWith('export class ')) {
      const match = line.match(classRegex);
      if (match) {
        items.push({
          type: 'class',
          name: match[1],
          line: index + 1,
        });
      }
    } else if (
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('export interface ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('export type ')
    ) {
      const match = line.match(interfaceRegex);
      if (match) {
        items.push({
          type: 'interface/type',
          name: match[1],
          line: index + 1,
        });
      }
    } else if (trimmed.includes('pgTable(') || trimmed.includes('jsonSchema(')) {
      const match = line.match(schemaRegex);
      if (match) {
        items.push({
          type: 'schema',
          name: match[1],
          line: index + 1,
        });
      }
    }
  });

  return items;
}

// Deterministic seed-based vector generator for strings (dimension = 128)
function getDeterministicVector(text: string, dimensions = 128): number[] {
  const vector: number[] = [];
  let hash = 0;

  // Polynomial rolling hash
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  for (let d = 0; d < dimensions; d++) {
    // Generate values between -1.0 and 1.0 using Math.sin
    const x = Math.sin(hash + d * 1024) * 10000;
    vector.push(x - Math.floor(x));
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => (magnitude === 0 ? 0 : val / magnitude));
}

// Simple term-frequency (sparse keyword match) scoring helper
function getKeywordMatchScore(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return 0;

  const textLower = text.toLowerCase();
  let matches = 0;

  queryWords.forEach((word) => {
    // Simple count of occurrences
    let index = textLower.indexOf(word);
    while (index !== -1) {
      matches++;
      index = textLower.indexOf(word, index + 1);
    }
  });

  return matches / queryWords.length;
}

// Main API Router handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'list-files') {
      const files = await scanFiles(WORKSPACE_ROOT);
      // Sort by score descending, then by path
      files.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
      return NextResponse.json({ success: true, files });
    }

    if (action === 'read-file') {
      const { filePath } = body;
      if (!filePath) {
        return NextResponse.json({ success: false, error: 'filePath parameter is required.' }, { status: 400 });
      }

      const fullPath = path.resolve(WORKSPACE_ROOT, filePath);

      // Security check: ensure path is within workspace root
      if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        return NextResponse.json({ success: false, error: 'Access denied: Out of workspace bounds.' }, { status: 403 });
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      return NextResponse.json({ success: true, content });
    }

    if (action === 'parse-ast') {
      const { code, filePath } = body;
      let targetCode = code;

      if (filePath) {
        const fullPath = path.resolve(WORKSPACE_ROOT, filePath);
        if (!fullPath.startsWith(WORKSPACE_ROOT)) {
          return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
        }
        targetCode = await fs.readFile(fullPath, 'utf-8');
      }

      if (targetCode === undefined || targetCode === null) {
        return NextResponse.json({ success: false, error: 'No code or filePath provided.' }, { status: 400 });
      }

      const outline = parseASTOutline(targetCode);
      return NextResponse.json({ success: true, outline });
    }

    if (action === 'chunk-text') {
      const { text: textToChunk, chunkSize = 200, chunkOverlap = 50 } = body;

      if (!textToChunk) {
        return NextResponse.json({ success: false, error: 'text is required.' }, { status: 400 });
      }

      // Simple character-based sliding-window chunking
      const chunks: any[] = [];
      let index = 0;
      let start = 0;

      while (start < textToChunk.length) {
        const end = Math.min(start + chunkSize, textToChunk.length);
        const chunkText = textToChunk.substring(start, end);

        chunks.push({
          id: `chunk-${index}`,
          text: chunkText,
          start,
          end,
          size: chunkText.length,
        });

        if (end === textToChunk.length) {
          break;
        }

        start += chunkSize - chunkOverlap;
        index++;
      }

      return NextResponse.json({ success: true, chunks });
    }

    if (action === 'hybrid-search') {
      const { query, chunks, denseWeight = 0.5, sparseWeight = 0.5 } = body;

      if (!query || !chunks || !Array.isArray(chunks)) {
        return NextResponse.json({ success: false, error: 'query and chunks array are required.' }, { status: 400 });
      }

      const queryVector = getDeterministicVector(query);

      // 1. Calculate Vector Scores & Ranks
      const denseResults = chunks.map((chunk: any) => {
        const chunkVector = getDeterministicVector(chunk.text);
        // Cosine similarity for normalized vectors is just the dot product
        const similarity = queryVector.reduce((sum, val, idx) => sum + val * chunkVector[idx], 0);
        // Scale to 0 - 1 range
        const cosineScore = (similarity + 1) / 2;
        return { chunkId: chunk.id, text: chunk.text, score: cosineScore };
      });
      denseResults.sort((a, b) => b.score - a.score);
      const denseRankMap = new Map(denseResults.map((item, idx) => [item.chunkId, idx + 1]));

      // 2. Calculate Keyword/Sparse Scores & Ranks
      const sparseResults = chunks.map((chunk: any) => {
        const score = getKeywordMatchScore(query, chunk.text);
        return { chunkId: chunk.id, text: chunk.text, score };
      });
      sparseResults.sort((a, b) => b.score - a.score);
      const sparseRankMap = new Map(sparseResults.map((item, idx) => [item.chunkId, idx + 1]));

      // 3. Perform Reciprocal Rank Fusion (RRF)
      // RRF Score = denseWeight * (1 / (60 + denseRank)) + sparseWeight * (1 / (60 + sparseRank))
      const k = 60; // Standard constant in RRF
      const hybridResults = chunks.map((chunk: any) => {
        const denseRank = denseRankMap.get(chunk.id) || chunks.length;
        const sparseRank = sparseRankMap.get(chunk.id) || chunks.length;

        const denseScore = denseResults.find((d) => d.chunkId === chunk.id)?.score || 0;
        const sparseScore = sparseResults.find((s) => s.chunkId === chunk.id)?.score || 0;

        const denseRRF = 1 / (k + denseRank);
        const sparseRRF = 1 / (k + sparseRank);
        const rrfScore = denseWeight * denseRRF + sparseWeight * sparseRRF;

        return {
          id: chunk.id,
          text: chunk.text,
          denseRank,
          denseScore,
          sparseRank,
          sparseScore,
          denseRRF: parseFloat(denseRRF.toFixed(6)),
          sparseRRF: parseFloat(sparseRRF.toFixed(6)),
          rrfScore: parseFloat(rrfScore.toFixed(6)),
        };
      });

      // Sort by RRF Score descending
      hybridResults.sort((a, b) => b.rrfScore - a.rrfScore);

      return NextResponse.json({
        success: true,
        query,
        results: hybridResults,
      });
    }

    if (action === 'compress') {
      const { text: rawText, compressionLevel = 'medium' } = body;
      if (!rawText) {
        return NextResponse.json({ success: false, error: 'text is required.' }, { status: 400 });
      }

      // Implement highly smart rules-based semantic-preserving compression
      let compressedText = rawText;
      const originalLen = rawText.length;

      if (compressionLevel === 'high') {
        // High compression: extract key sentences, strip imports/exports, remove double newlines, shorten code blocks
        compressedText = rawText
          .split('\n')
          .filter((line: string) => {
            const trim = line.trim();
            // Skip imports, single braces, comment-only lines
            if (trim.startsWith('import ') || trim.startsWith('} from ')) return false;
            if (trim === '}' || trim === '};' || trim === '];') return false;
            if (trim.startsWith('//') || trim.startsWith('/*') || trim.startsWith('*')) return false;
            return true;
          })
          .map((line: string) => {
            // Cut super long lines
            if (line.length > 80) return line.substring(0, 77) + '...';
            return line;
          })
          .join('\n')
          .replace(/\n\s*\n+/g, '\n'); // Remove blank lines
      } else {
        // Medium compression: collapse whitespace, remove comments, clean up imports
        compressedText = rawText
          .split('\n')
          .filter((line: string) => {
            const trim = line.trim();
            if (trim.startsWith('//') || trim.startsWith('/*')) return false;
            return true;
          })
          .join('\n')
          .replace(/\n\s*\n+/g, '\n');
      }

      const compressedLen = compressedText.length;
      const savingsPercent = Math.max(0, Math.round(((originalLen - compressedLen) / originalLen) * 100));

      return NextResponse.json({
        success: true,
        originalLength: originalLen,
        compressedLength: compressedLen,
        savingsPercent,
        compressedText,
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('API Error in Context Engine:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
