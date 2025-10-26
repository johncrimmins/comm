/**
 * Message transformation definitions
 * Each transformation defines how text should be modified
 */

export interface Transformation {
  id: string;
  label: string;
  systemPrompt: string;
}

export const transformations: Transformation[] = [
  {
    id: 'concise',
    label: 'Concise',
    systemPrompt: 'You are a helpful assistant that makes messages more concise while preserving the original intent and any references (names, dates, places, etc.). Return only the concise version without any additional explanation.'
  },
  {
    id: 'professionalize',
    label: 'Professionalize',
    systemPrompt: 'You are a helpful assistant that rewrites messages to sound more professional without jargon. Maintain the core meaning and all references (names, dates, places, etc.). Return only the professional version without any additional explanation.'
  },
  {
    id: 'technicalize',
    label: 'Technicalize',
    systemPrompt: 'You are a helpful assistant that replaces ambiguous or unclear terms with precise technical terminology. Maintain clarity and all references (names, dates, places, etc.). Return only the technical version without any additional explanation.'
  }
];

