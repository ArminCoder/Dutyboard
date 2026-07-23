import { generateWorld } from './generator';

// Singleton — generisan jednom po boot-u. Isti seed = ista svakoga puta.
export const world = generateWorld();
