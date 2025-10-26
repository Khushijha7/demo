'use server';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const apps = getApps();

const app = apps.length ? getApp() : initializeApp();

export function getAuth() {
  return getAdminAuth(app);
}

export function getFirestore() {
  return getAdminFirestore(app);
}
