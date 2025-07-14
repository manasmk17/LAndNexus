import { Client } from 'pg';

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    await client.connect();
    console.log("Connected successfully!");
    await client.end();
  } catch (error) {
    console.error("Connection error:", error);
  }
}

test();
