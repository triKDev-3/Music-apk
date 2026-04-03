// ⚠️ Ce fichier est conservé pour compatibilité.
// Toute la logique Firebase est centralisée dans ./services/firebaseService.ts
// pour éviter les doubles initialisations (crash Android)
export { auth, db } from './services/firebaseService';

