export const slackify = (input: string): string => {
  return input
    .split("\n")
    .map((line) => {
      // Handle headings first
      const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const text = headingMatch[1].trim();
        return `*${text}*`;
      }
      
      let processedLine = line;
      
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
      
      // Code blocks remain unchanged (handled by default)
      
      return processedLine;
    })
    .join("\n");
};
