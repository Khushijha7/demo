'use server';

import {config} from 'dotenv';
config();

// This file is used to register all Genkit flows for development.
// It is not used in production.
import './flows/get-market-data';
import './flows/personalized-financial-insights';
