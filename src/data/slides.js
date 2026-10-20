/* A role's `visual` names what it shows; the stage and the roles share these slide names. */
const SLIDES = { ticketDemo: 'demo', memory: 'memory', rewrite: 'rewrite', trace: 'trace' };

export function slideName(visual) {
  const name = SLIDES[visual];
  if (!name) throw new Error(`Unknown visual: ${visual}`);
  return name;
}
