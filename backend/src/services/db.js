
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://kirana:kirana_dev@localhost:5432/kirana",
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL connection error:", error.message);
});

module.exports = pool;