'use server';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const apps = getApps();

// When no-args are provided, the SDK will look for credentials via ADC
// or GOOGLE_APPLICATION_CREDENTIALS environment variables.
// In a local emulated environment, it will connect to the emulators.
const app = apps.length ? getApp() : initializeApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);
