#!/usr/bin/env tsx
import { readFileSync } from 'node:fs'
import { parseTimeTrackerCsv } from '../src/csv-import.ts'

const [, , inputPath] = process.argv
if (!inputPath) {
  console.error('usage: csv-to-json.ts <input.csv>')
  process.exit(1)
}

const text = readFileSync(inputPath, 'utf8')
const events = parseTimeTrackerCsv(text, () => crypto.randomUUID())
process.stdout.write(JSON.stringify(events, null, 2) + '\n')
