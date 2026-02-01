export const slackify = (input: string): string => {
  const lines = input.split("\n");
  let result: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a table
    if (isTableRow(line)) {
      // Find all consecutive table rows
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      
      // Process each table line individually (excluding markdown conversion)
      const processedTableLines = tableLines.map(tableLine => {
        let processedLine = tableLine;
        
        // Handle headings within table rows
        const headingMatch = processedLine.match(/^#{1,6}\s+(.*)$/);
        if (headingMatch) {
          const text = headingMatch[1].trim();
          return `*${text}*`;
        }
        
        // Only process links in tables, leave other markdown as-is
        processedLine = processedLine.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
          if (text === '') {
            return `<${url}>`;
          }
          return `<${url}|${text}>`;
        });
        
        return processedLine;
      });
      
      // Wrap the entire table in code blocks
      result.push('```');
      result.push(...processedTableLines);
      result.push('```');
    } else {
      // Process regular line
      let processedLine = line;
      
      // Handle headings first
      const headingMatch = processedLine.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const text = headingMatch[1].trim();
        processedLine = `*${text}*`;
      } else {
        // Store original line for context checks
        const originalLine = processedLine;
        
        // Convert markdown links: [text](url) -> <url|text>
        processedLine = processedLine.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
          if (text === '') {
            return `<${url}>`;
          }
          return `<${url}|${text}>`;
        });
        
        // First pass: Convert bold text and mark converted portions
        // Replace **bold** with *bold*
        processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '*$1*');
        // Replace __bold__ with *bold*
        processedLine = processedLine.replace(/__([^_]+)__/g, '*$1*');
        
        // Second pass: Convert italic text: *text* -> _text_
        // But only convert if it wasn't originally bold (**text** or __text__)
        processedLine = processedLine.replace(/\*([^*\n]+)\*/g, (match, content) => {
          // Check if this was originally bold in the original line
          const wasAsteriskBold = originalLine.includes(`**${content}**`);
          const wasUnderscoreBold = originalLine.includes(`__${content}__`);
          
          if (wasAsteriskBold || wasUnderscoreBold) {
            // This was originally bold, keep it as *content*
            return match;
          }
          // This was originally *content* (italic), convert to _content_
          return `_${content}_`;
        });
      }
      
      // Code blocks remain unchanged (handled by default)
      
      result.push(processedLine);
      i++;
    }
  }
  
  return result.join("\n");
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
