import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from '../src/routes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const API_KEY = process.env.API_KEY || 'dev_key_2026';

const authGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (DISABLE_AUTH) return next();
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

app.get('/', (_req, res) => res.json({ ok: true, service: 'whatsapp-crm-backend' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', authGuard, routes);

export default app;
