export const slackify = (input: string): string => {
  return input
    .split("\n")
    .map((line) => {
      const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const text = headingMatch[1].trim();
        return `*${text}*`;
      }
      return line;
    })
    .join("\n");
};
