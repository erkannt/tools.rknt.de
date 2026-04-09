/**
 * Check if a line is a list item (unordered or ordered)
 */
function isListItem(line: string): boolean {
  const trimmed = line.trimStart();
  const unorderedPattern = /^[-*+]\s/;
  const orderedPattern = /^\d+\.\s/;
  if (unorderedPattern.test(trimmed) || orderedPattern.test(trimmed)) {
    return true;
  }
  const spaceIndentedPattern = /^(\s{4,})([-*+]|\d+\.)\s/;
  return spaceIndentedPattern.test(line);
}

/**
 * Convert leading tabs to spaces for list items (4 spaces per tab)
 * Also convert 2+ leading spaces to 4 spaces per nesting level for nested list items
 */
function processListItem(line: string): string {
  if (!isListItem(line)) {
    return line;
  }
  
  const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
  const content = line.slice(leadingWhitespace.length);
  
  if (!isListItem(content)) {
    return line;
  }
  
  const tabCount = (leadingWhitespace.match(/\t/g) || []).length;
  const spaceCount = (leadingWhitespace.match(/ /g) || []).length;
  
  const totalNestingLevel = tabCount + Math.ceil(spaceCount / 4);
  const newIndentation = ' '.repeat(totalNestingLevel * 4);
  
  return newIndentation + content;
}

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
 * Convert markdown links to Slack format with numbered references
 */
function processLinks(line: string, urlRegistry: Map<string, number>): string {
  return line.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    const encodedUrl = encodeURI(decodeURI(url));
    
    if (text === '') {
      return `<${encodedUrl}>`;
    }
    
    let index = urlRegistry.get(encodedUrl);
    if (index === undefined) {
      index = urlRegistry.size + 1;
      urlRegistry.set(encodedUrl, index);
    }
    
    return `${text}[${index}]`;
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
function processTableLines(lines: string[], startIndex: number, urlRegistry: Map<string, number>): [string[], number] {
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
    return processLinks(tableLine, urlRegistry);
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
  const urlRegistry = new Map<string, number>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a table
    if (isTableRow(line)) {
      const [tableResult, nextIndex] = processTableLines(lines, i, urlRegistry);
      processedLines.push(...tableResult);
      i = nextIndex - 1; // -1 because for loop will increment
    } else {
      // Process regular line
      let processedLine = line;

      // Handle headings first
      const headingResult = processHeading(processedLine);
      if (headingResult) {
        processedLine = headingResult;
        // Add empty line before heading if not first line and previous line not empty
        if (processedLines.length > 0) {
          const lastLine = processedLines[processedLines.length - 1];
          if (lastLine !== '') {
            processedLines.push('');
          }
        }
      } else {
        // Store original line for formatting context checks
        const originalLine = processedLine;

        // Convert leading tabs to spaces for list items
        processedLine = processListItem(processedLine);

        // Convert links
        processedLine = processLinks(processedLine, urlRegistry);

        // Convert formatting (bold/italic)
        processedLine = processFormatting(processedLine, originalLine);
      }

      processedLines.push(processedLine);
    }
  }
  
  let result = processedLines.join("\n");
  
  // Append numbered URLs if any were found
  if (urlRegistry.size > 0) {
    const urlEntries = Array.from(urlRegistry.entries()).sort((a, b) => a[1] - b[1]);
    const urlList = urlEntries.map(([url, index]) => `[${index}] ${url}`).join("\n");
    result = result + "\n\n" + urlList;
  }
  
  return result;
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
