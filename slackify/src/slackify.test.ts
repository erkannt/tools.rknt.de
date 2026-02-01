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
});