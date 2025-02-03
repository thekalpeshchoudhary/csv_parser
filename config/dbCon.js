import pkg from "pg";
import colors from 'colors'

const { Pool } = pkg;
const connectionPool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASS,
    port: process.env.POSTGRES_PORT,
});

connectionPool
    .connect()
    .then(console.log(`App Connected to DB at ${new Date()}`['yellow']));

export default connectionPool;