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

  describe('link conversion', () => {
    it.each<TestCase>([
      {
        message: 'should convert markdown links to slack format',
        input: 'This is [link text](https://example.com)',
        expected: 'This is <https://example.com|link text>'
      },
      {
        message: 'should handle links with spaces in text',
        input: '[Link with spaces](https://example.com)',
        expected: '<https://example.com|Link with spaces>'
      },
      {
        message: 'should handle multiple links',
        input: '[First](https://first.com) and [second](https://second.com)',
        expected: '<https://first.com|First> and <https://second.com|second>'
      },
      {
        message: 'should handle link at start of line',
        input: '[Start](https://start.com) link',
        expected: '<https://start.com|Start> link'
      },
      {
        message: 'should handle link at end of line',
        input: 'End with [link](https://end.com)',
        expected: 'End with <https://end.com|link>'
      },
      {
        message: 'should handle empty link text',
        input: '[](/empty)',
        expected: '</empty>'
      },
      {
        message: 'should handle complex URLs',
        input: '[API](https://api.example.com/v1/users/123?query=test)',
        expected: '<https://api.example.com/v1/users/123?query=test|API>'
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
        expected: '```\n| Name | Link |\n|------|------|\n| Site | <https://google.com|Google> |\n```'
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
});