'use server';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

const apps = getApps();

const app = apps.length
  ? getApp()
  : initializeApp({
      credential: undefined, // Let ADC find the credential
      projectId: firebaseConfig.projectId,
    });

export const auth = getAuth(app);
export const firestore = getFirestore(app);
