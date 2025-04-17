import { WebSocket } from 'ws';

// Make WebSocket available globally before any other imports
Object.assign(global, { WebSocket });


// Export nothing since this is just for side effects
export {}; 