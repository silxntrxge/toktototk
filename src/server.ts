import express from 'express';
import tiktokMusicRouter from './api/tiktokMusic';

const app = express();
app.use(express.json());
app.use('/api', tiktokMusicRouter);

// ... rest of your server setup