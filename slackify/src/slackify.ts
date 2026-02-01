/**
 * Convert markdown headings to Slack bold format
 */
function processHeading(line: string): string | null {
  const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
  if (headingMatch) {
    const text = headingMatch[1].trim();
    return `*${text}*`;
  }
  return null;
}

/**
 * Convert markdown links to Slack format
 */
function processLinks(line: string): string {
  return line.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    if (text === '') {
      return `<${url}>`;
    }
    return `<${url}|${text}>`;
  });
}

/**
 * Convert markdown formatting (bold/italic) to Slack format
 */
function processFormatting(line: string, originalLine: string): string {
  let processedLine = line;
  
  // First pass: Convert bold text: **text** and __text__ -> *text*
  processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  processedLine = processedLine.replace(/__([^_]+)__/g, '*$1*');
  
  // Second pass: Convert italic text: *text* -> _text_
  // But only convert if it wasn't originally bold (**text** or __text__)
  processedLine = processedLine.replace(/\*([^*\n]+)\*/g, (match, content) => {
    const wasAsteriskBold = originalLine.includes(`**${content}**`);
    const wasUnderscoreBold = originalLine.includes(`__${content}__`);
    
    if (wasAsteriskBold || wasUnderscoreBold) {
      return match; // Keep as *content*
    }
    return `_${content}_`; // Convert italic to _content_
  });
  
  return processedLine;
}

/**
 * Process table lines and return processed lines with new index
 */
function processTableLines(lines: string[], startIndex: number): [string[], number] {
  const tableLines: string[] = [];
  let currentIndex = startIndex;
  
  // Collect consecutive table rows
  while (currentIndex < lines.length && isTableRow(lines[currentIndex])) {
    tableLines.push(lines[currentIndex]);
    currentIndex++;
  }
  
  // Process each table line (limited markdown conversion)
  const processedTableLines = tableLines.map(tableLine => {
    // Handle headings within table rows
    const headingResult = processHeading(tableLine);
    if (headingResult) {
      return headingResult;
    }
    
    // Only process links in tables, leave other markdown as-is
    return processLinks(tableLine);
  });
  
  // Wrap table in code blocks
  const wrappedTable = ['```', ...processedTableLines, '```'];
  return [wrappedTable, currentIndex];
}



/**
 * Convert markdown to Slack markup
 */
export const slackify = (input: string): string => {
  // Early return for empty input
  if (!input || input.trim() === '') {
    return input;
  }
  
  const lines = input.split("\n");
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a table
    if (isTableRow(line)) {
      const [tableResult, nextIndex] = processTableLines(lines, i);
      processedLines.push(...tableResult);
      i = nextIndex - 1; // -1 because for loop will increment
    } else {
      // Process regular line
      let processedLine = line;
      
      // Handle headings first
      const headingResult = processHeading(processedLine);
      if (headingResult) {
        processedLine = headingResult;
      } else {
        // Store original line for formatting context checks
        const originalLine = processedLine;
        
        // Convert links
        processedLine = processLinks(processedLine);
        
        // Convert formatting (bold/italic)
        processedLine = processFormatting(processedLine, originalLine);
      }
      
      processedLines.push(processedLine);
    }
  }
  
  return processedLines.join("\n");
};

/**
 * Check if a line looks like a table row
 * Table rows typically contain pipe characters and follow markdown table syntax
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  // A table row should have at least one pipe character
  if (!trimmed.includes('|')) return false;
  
  // Check if it looks like a markdown table row
  // Should start and/or end with pipes for proper markdown table syntax
  const startsWithPipe = trimmed.startsWith('|');
  const endsWithPipe = trimmed.endsWith('|');
  
  // If it starts with |, it's likely a table row
  if (startsWithPipe) return true;
  
  // If it ends with |, it's likely a table row
  if (endsWithPipe) return true;
  
  // Otherwise, check for clear column separation with multiple pipes
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  if (pipeCount < 3) return false;
  
  // Look for proper spacing around pipes (indicating table columns)
  const hasGoodSpacing = /\s+\|\s+/.test(trimmed);
  if (!hasGoodSpacing) return false;
  
  // Split by pipes and check if we have meaningful content separation
  const parts = trimmed.split('|').map(part => part.trim()).filter(part => part !== '');
  
  // Must have at least 3 non-empty parts to be considered a table (not simple text)
  return parts.length >= 3;
}
