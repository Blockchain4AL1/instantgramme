import { createPool, Pool } from "mysql2/promise";

export const connect = async (): Promise<Pool> => {
  console.log("connect")
  const connection = await createPool({
    host: `${process.env.host}`,
    user: `${process.env.userDb}`,
    port : 3306,
    password: `${process.env.passwordDb}`,
    database: `${process.env.DB_DATABASE}`,
    connectionLimit: 10,
  });

  return connection;
};
