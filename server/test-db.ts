import { Client } from 'pg';

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
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
