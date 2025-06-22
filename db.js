import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();  

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT, 10),
});