import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt-nodejs";
import { SignIn } from "../interfaces/user_interface";
import { connect } from "../lib/connection";
import { generateJsonWebToken } from "../lib/generate_jwt";
import { IVerifyUser } from "../interfaces/user_interface";
import {StreamChat} from "stream-chat";

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, password }: SignIn = req.body;

    const conn = await connect();

    // Check is exists Email on database
    const [SignIndb] = await conn.query<RowDataPacket[0]>(
      "SELECT username, password FROM users WHERE username = ?",
      [username]
    );

    if (SignIndb.length == 0) {
      return res.status(401).json({
        message: "Credentials are not registered",
      });
    }

    const verifyUser: IVerifyUser = SignIndb[0];

    // Check Password
    if (!(await bcrypt.compareSync(password, verifyUser.password))) {
      return res.status(401).json({
        message: "email or password incorrect",
      });
    }

    //fix provisoire : pas compris comment const ca marchait { uid } = uidPersondb[0][0];
    const uidPersondb = await conn.query<RowDataPacket[]>(
      "SELECT description as uid FROM users WHERE username = ?",
      [username]
    );
    const uidPersondbfn = await conn.query<RowDataPacket[]>(
        "SELECT firstname as fname FROM users WHERE username = ?",
        [username]
    );
    const uidPersondbln = await conn.query<RowDataPacket[]>(
        "SELECT lastname as lname FROM users WHERE username = ?",
        [username]
    );

    const { uid } = uidPersondb[0][0];
    const { fname } = uidPersondbfn[0][0];
    const { lname } = uidPersondbln[0][0];

    conn.end();

// Initialize a Server Client
    const serverClient = StreamChat.getInstance(`${process.env.API_KEY}`, `${process.env.SECRET}`);
// Create User Token
    const userToken = serverClient.createToken(username);

    return res.json({
      message: "Welcome on  instatagram",
      token: "Bearer ",
      username: username,
      description:uid,
      userToken : userToken,
      firstname : fname,
      lastname : lname,

    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const renweLogin = async (req: Request, res: Response) => {
  try {
    const token = generateJsonWebToken(req.idPerson);

    return res.json({
      message: "Bienvenue sur le reseau social du projet annuel",
      token: token,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

const resendCodeEmail = async (email: string): Promise<void> => {
  const conn = await connect();

  const randomNumber = Math.floor(10000 + Math.random() * 90000);

  await conn.query("UPDATE users SET token_temp = ? WHERE email = ?", [
    randomNumber,
    email,
  ]);

  conn.end();
};
