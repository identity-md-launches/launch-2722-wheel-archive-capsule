export type Capsule = {
  id: number;
  title: string;
  date: string;
  theme: 'sage' | 'peach' | 'lavender' | 'sand' | 'blue' | 'rose';
  shape: number;
  turns: number;
  note: string;
  story: string;
};

// Curated exhibition content, not an onchain settlement feed.
export const capsules: Capsule[] = [
  { id: 184, title: 'A full circle', date: '2026-10-28', theme: 'sage', shape: 0, turns: 36, note: 'Some endings are a place to begin.', story: 'Thirty-six turns fold into one continuous form. The last line meets the first, holding a small record of a cycle completed. A full circle, with room for whatever comes next.' },
  { id: 183, title: 'Room to grow', date: '2026-10-21', theme: 'peach', shape: 1, turns: 28, note: 'A little space changes everything.', story: 'An open center gives this settlement its shape. Each loop reaches a little further than the last, leaving a quiet space for the next turn to find its way.' },
  { id: 182, title: 'A different orbit', date: '2026-10-14', theme: 'lavender', shape: 2, turns: 42, note: 'The same pull. A new perspective.', story: 'A familiar path seen from another angle. Forty-two lines cross and return, tracing the many ways a settlement can arrive at the same shared center.' },
  { id: 181, title: 'Between the lines', date: '2026-10-07', theme: 'sand', shape: 3, turns: 32, note: 'What stays is often the space between.', story: 'Close lines, held just apart. This capsule keeps the spaces as carefully as the marks: a record of small choices becoming one coherent turn.' },
  { id: 180, title: 'In good time', date: '2026-09-30', theme: 'blue', shape: 4, turns: 24, note: 'Every turn finds its own rhythm.', story: 'A slower rhythm moves through twenty-four wide arcs. Nothing is hurried. The form resolves when each line has found its place, and the settlement is ready to rest.' },
  { id: 179, title: 'Common ground', date: '2026-09-23', theme: 'rose', shape: 5, turns: 40, note: 'Many paths, one shared center.', story: 'Separate loops gather around a common point. Their intersections make a new pattern, keeping a trace of the individual turns within a shape that belongs to all of them.' },
];

export const formatDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
export const capsuleNumber = (id: number) => `#${String(id).padStart(4, '0')}`;
