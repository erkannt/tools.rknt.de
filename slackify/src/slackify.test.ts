import { describe, it, expect } from 'vitest';
import { slackify } from './slackify';

interface TestCase {
  message: string;
  input: string;
  expected: string;
}

describe('slackify', () => {
  describe('headings', () => {
    it.each<TestCase>([
      {
        message: 'should convert h1 heading to bold text',
        input: '# Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should add empty line before heading when not first line',
        input: 'Some text\n# Hello World',
        expected: 'Some text\n\n*Hello World*'
      },
      {
        message: 'should add empty line before heading after other headings',
        input: '# First heading\n# Second heading',
        expected: '*First heading*\n\n*Second heading*'
      },
      {
        message: 'should not add empty line before first heading',
        input: '# First heading\nSome text',
        expected: '*First heading*\nSome text'
      },
      {
        message: 'should not add extra empty line if already present before heading',
        input: 'Some text\n\n# Heading',
        expected: 'Some text\n\n*Heading*'
      },
      {
        message: 'should convert h2 heading to bold text',
        input: '## Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should convert h3 heading to bold text',
        input: '### Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should convert h4 heading to bold text',
        input: '#### Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should convert h5 heading to bold text',
        input: '##### Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should convert h6 heading to bold text',
        input: '###### Hello World',
        expected: '*Hello World*'
      },
      {
        message: 'should handle headings with extra whitespace',
        input: '#   Hello   World   ',
        expected: '*Hello   World*'
      },
      {
        message: 'should handle empty heading',
        input: '# ',
        expected: '**'
      },
      {
        message: 'should handle heading with only spaces',
        input: '#   ',
        expected: '**'
      },
      {
        message: 'should handle heading with markdown inside',
        input: '# **Bold** and *italic* text',
        expected: '***Bold** and *italic* text*'
      },
      {
        message: 'should not convert lines starting with # but not headings',
        input: '#hashtag content',
        expected: '#hashtag content'
      },
      {
        message: 'should handle heading with inline code',
        input: '# Code: `console.log()`',
        expected: '*Code: `console.log()`*'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('multiline content', () => {
    it.each<TestCase>([
      {
        message: 'should handle single line without heading',
        input: 'This is regular text',
        expected: 'This is regular text'
      },
      {
        message: 'should handle multiple lines with headings',
        input: '# Title\nThis is content',
        expected: '*Title*\nThis is content'
      },
      {
        message: 'should preserve empty lines',
        input: '# Title\n\nThis is content',
        expected: '*Title*\n\nThis is content'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('bold text conversion', () => {
    it.each<TestCase>([
      {
        message: 'should convert double asterisk bold to single asterisk',
        input: 'This is **bold** text',
        expected: 'This is *bold* text'
      },
      {
        message: 'should convert double underscore bold to single asterisk',
        input: 'This is __bold__ text',
        expected: 'This is *bold* text'
      },
      {
        message: 'should handle multiple bold instances',
        input: '**First** and **second** bold',
        expected: '*First* and *second* bold'
      },
      {
        message: 'should handle bold at beginning of line',
        input: '**Bold** start',
        expected: '*Bold* start'
      },
      {
        message: 'should handle bold at end of line',
        input: 'End with **bold**',
        expected: 'End with *bold*'
      },
      {
        message: 'should not convert single asterisk to bold',
        input: 'This is *not bold* text',
        expected: 'This is _not bold_ text'
      },
      {
        message: 'should handle mixed bold styles',
        input: '**Bold** and __also bold__',
        expected: '*Bold* and *also bold*'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('italic text conversion', () => {
    it.each<TestCase>([
      {
        message: 'should convert single asterisk italic to underscore',
        input: 'This is *italic* text',
        expected: 'This is _italic_ text'
      },
      {
        message: 'should convert single underscore italic to underscore',
        input: 'This is _italic_ text',
        expected: 'This is _italic_ text'
      },
      {
        message: 'should handle multiple italic instances',
        input: '*First* and *second* italic',
        expected: '_First_ and _second_ italic'
      },
      {
        message: 'should not convert double asterisk to italic',
        input: 'This is **not italic** text',
        expected: 'This is *not italic* text'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('inline code conversion', () => {
    it.each<TestCase>([
      {
        message: 'should preserve single backtick code',
        input: 'This is `code` text',
        expected: 'This is `code` text'
      },
      {
        message: 'should handle multiple code instances',
        input: '`First` and `second` code',
        expected: '`First` and `second` code'
      },
      {
        message: 'should preserve empty code',
        input: 'This is `` empty code',
        expected: 'This is `` empty code'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('numbered link references', () => {
    it.each<TestCase>([
      {
        message: 'should convert links to numbered references',
        input: '[link text](https://example.com)',
        expected: 'link text[1]\n\n[1] https://example.com'
      },
      {
        message: 'should reuse same number for duplicate URLs',
        input: '[first](https://example.com) and [second](https://example.com)',
        expected: 'first[1] and second[1]\n\n[1] https://example.com'
      },
      {
        message: 'should keep empty link text as angle bracket format',
        input: '[](https://example.com)',
        expected: '<https://example.com>'
      },
      {
        message: 'should handle multiple links with different URLs',
        input: '[first link](https://first.com) and [second link](https://second.com)',
        expected: 'first link[1] and second link[2]\n\n[1] https://first.com\n[2] https://second.com'
      },
      {
        message: 'should handle link at start of line',
        input: '[Start](https://start.com) link',
        expected: 'Start[1] link\n\n[1] https://start.com'
      },
      {
        message: 'should handle link at end of line',
        input: 'End with [link](https://end.com)',
        expected: 'End with link[1]\n\n[1] https://end.com'
      },
      {
        message: 'should handle links with spaces in text',
        input: '[Link with spaces](https://example.com)',
        expected: 'Link with spaces[1]\n\n[1] https://example.com'
      },
      {
        message: 'should handle link in middle of text with surrounding content',
        input: 'See the [documentation](https://docs.example.com) for details',
        expected: 'See the documentation[1] for details\n\n[1] https://docs.example.com'
      },
      {
        message: 'should handle multiple links on same line',
        input: '[Google](https://google.com) and [GitHub](https://github.com)',
        expected: 'Google[1] and GitHub[2]\n\n[1] https://google.com\n[2] https://github.com'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('table handling', () => {
    it.each<TestCase>([
      {
        message: 'should wrap simple table in code block',
        input: '| Name | Age |\n|------|-----|\n| John | 25  |',
        expected: '```\n| Name | Age |\n|------|-----|\n| John | 25  |\n```'
      },
      {
        message: 'should wrap table with markdown in code block',
        input: '| **Name** | *Age* |\n|----------|------|\n| **John** | *25*  |',
        expected: '```\n| **Name** | *Age* |\n|----------|------|\n| **John** | *25*  |\n```'
      },
      {
        message: 'should handle table with links',
        input: '| Name | Link |\n|------|------|\n| Site | [Google](https://google.com) |',
        expected: '```\n| Name | Link |\n|------|------|\n| Site | Google[1] |\n```\n\n[1] https://google.com'
      },
      {
        message: 'should preserve empty lines around tables',
        input: 'Text before\n\n| Name | Age |\n|------|-----|\n| John | 25  |\n\nText after',
        expected: 'Text before\n\n```\n| Name | Age |\n|------|-----|\n| John | 25  |\n```\n\nText after'
      },
      {
        message: 'should handle table with pipe characters in content',
        input: '| Name | Description |\n|------|-------------|\n| Test | Contains \\| character |',
        expected: '```\n| Name | Description |\n|------|-------------|\n| Test | Contains \\| character |\n```'
      },
      {
        message: 'should not wrap non-table lines that look like tables',
        input: 'This is | not | a table',
        expected: 'This is | not | a table'
      },
      {
        message: 'should handle incomplete table structures',
        input: '| Name | Age |\n| John | 25',
        expected: '```\n| Name | Age |\n| John | 25\n```'
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });

  describe('edge cases and cleanup', () => {
    it.each<TestCase>([
      {
        message: 'should handle empty input',
        input: '',
        expected: ''
      },
      {
        message: 'should handle only whitespace input',
        input: '   \n\n   ',
        expected: '   \n\n   '
      },
      {
        message: 'should handle mixed content with multiple formatting types',
        input: '# Title\n\nThis has **bold** and *italic* and [links](http://example.com)\n\n| Name | Link |\n|------|------|\n| Site | [Example](http://example.com) |',
        expected: '*Title*\n\nThis has *bold* and _italic_ and links[1]\n\n```\n| Name | Link |\n|------|------|\n| Site | Example[1] |\n```\n\n[1] http://example.com'
      },
      {
        message: 'should handle nested formatting in headings',
        input: '# **Bold** *italic* heading',
        expected: '***Bold** *italic* heading*'
      },
      {
        message: 'should handle code blocks with other formatting',
        input: 'Here is `code` and **bold** text',
        expected: 'Here is `code` and *bold* text'
      },
      {
        message: 'should handle malformed bold markup',
        input: 'This is **bold text',
        expected: 'This is **bold text'
      },
      {
        message: 'should handle malformed italic markup',
        input: 'This is *italic text',
        expected: 'This is *italic text'
      },
      {
        message: 'should handle malformed links',
        input: 'This is [broken link(http://example.com)',
        expected: 'This is [broken link(http://example.com)'
      },
      {
        message: 'should handle unsupported markdown formats',
        input: 'This has ~~strikethrough~~ and ==highlight== text',
        expected: 'This has ~~strikethrough~~ and ==highlight== text'
      },
      {
        message: 'should handle list items',
        input: '- First item\n- Second item\n\n1. Numbered item\n2. Another numbered',
        expected: '- First item\n- Second item\n\n1. Numbered item\n2. Another numbered'
      },
      {
        message: 'should convert leading tabs to 4 spaces per nesting level in unordered list items',
        input: '- First item\n\t- Nested item',
        expected: '- First item\n    - Nested item'
      },
      {
        message: 'should convert leading tabs to 4 spaces per nesting level in ordered list items',
        input: '1. First item\n\t2. Nested item',
        expected: '1. First item\n    2. Nested item'
      },
      {
        message: 'should convert 4-space indentation to 4 spaces in nested unordered lists',
        input: '- First item\n    - Nested item',
        expected: '- First item\n    - Nested item'
      },
      {
        message: 'should convert 4-space indentation to 4 spaces in nested ordered lists',
        input: '1. First item\n    2. Nested item',
        expected: '1. First item\n    2. Nested item'
      },
      {
        message: 'should use 4 spaces per nesting level for deeply nested unordered lists',
        input: '- Item 1\n    - Item 2\n        - Item 3',
        expected: '- Item 1\n    - Item 2\n        - Item 3'
      },
      {
        message: 'should use 4 spaces per nesting level for deeply nested ordered lists',
        input: '1. Item 1\n    2. Item 1.1\n        3. Item 1.1.1',
        expected: '1. Item 1\n    2. Item 1.1\n        3. Item 1.1.1'
      },
      {
        message: 'should convert leading tabs to 4 spaces per nesting level',
        input: '- Item 1\n\t- Nested item',
        expected: '- Item 1\n    - Nested item'
      },
      {
        message: 'should convert double tabs to 8 spaces (two nesting levels)',
        input: '- Item 1\n\t\t- Deep nested item',
        expected: '- Item 1\n        - Deep nested item'
      },
      {
        message: 'should convert 2-space markdown indentation to 4 spaces in slack',
        input: '- Item 1\n  - Nested item',
        expected: '- Item 1\n    - Nested item'
      },
      {
        message: 'should handle blockquotes',
        input: '> This is a quote\n> That continues',
        expected: '> This is a quote\n> That continues'
      },
      {
        message: 'should handle horizontal rules',
        input: 'Text above\n\n---\n\nText below',
        expected: 'Text above\n\n---\n\nText below'
      },

      {
        message: 'should handle edge case with empty formatting',
        input: 'This has **empty** and ** ** bold',
        expected: 'This has *empty* and * * bold'
      },
      {
        message: 'should preserve trailing whitespace',
        input: 'Text with trailing spaces   ',
        expected: 'Text with trailing spaces   '
      },
      {
        message: 'should handle special characters',
        input: 'Special chars: & < > " \'',
        expected: 'Special chars: & < > " \''
      }
    ])('$message', ({ input, expected }) => {
      expect(slackify(input)).toBe(expected);
    });
  });
});