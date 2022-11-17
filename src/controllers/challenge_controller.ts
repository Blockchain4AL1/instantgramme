import { Request, Response } from "express";
import { connect } from "../lib/connection";
import { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from "uuid";
import {
  IChallenge,
  IChallengeResult,
  IUidChallenge,
} from "../interfaces/challenge_interface";

export const createNewChallengeResult = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      challenge_id,
      resultat_obtenu,
      temps_execution,
      used_language,
    }: IChallengeResult = req.body;

    const conn = await connect();

    const uidChallengeResult = uuidv4();

    await conn.query(
      "INSERT INTO challenge_result (uid, challenge_id, resultat_obtenu, temps_execution, user_id, used_language) value (?,?,?,?,?,?)",
      [
        uidChallengeResult,
        challenge_id,
        resultat_obtenu,
        temps_execution,
        req.idPerson,
        used_language,
      ]
    );

    return res.json({
      message: "Challenge result",
      uidChallengeResult: uidChallengeResult,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const createNewChallenge = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { title, description, resultat_attendu }: IChallenge = req.body;

    const conn = await connect();

    const uidChallenge = uuidv4();

    await conn.query(
      "INSERT INTO challenge (challenge_id, title, description , resultat_attendu) value (?,?,?,?)",
      [uidChallenge, title, description, resultat_attendu]
    );

    return res.json({
      message: "Challenge",
      Challenge_uid: uidChallenge,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const updateChallengeResultById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      challenge_id,
      resultat_obtenu,
      temps_execution,
      used_language,
    }: IChallengeResult = req.body;

    const conn = await connect();

    await conn.query(
      "UPDATE challenge_result SET resultat_obtenu = ?, temps_execution = ?, updated_at = ?, used_language = ? WHERE  uid = ?",
      [
        resultat_obtenu,
        temps_execution,
        req.body.updated_at,
        used_language,
        req.body.uid,
      ]
    );

    return res.json({
      message: "ChallengeResult mis à jour",
      uidChallengeResult: req.body.uid,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getChallenge = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const challengedb = await conn.query<RowDataPacket[]>(
      `select * from challenge;`
    );

    conn.end();

    return res.json({
      message: "Get challenge",
      challengesdb: challengedb[0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getChallengeByIdChallenge = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const chall = await conn.query<RowDataPacket[]>(
      "SELECT * FROM challenge WHERE challenge_id = ? LIMIT 1;",
      [req.params.challenge_id]
    );

    await conn.end();

    return res.json({
      message: "Get Challenge By Id",
      Challenge: chall[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getChallengeByIdChallengeResult = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const chall = await conn.query<RowDataPacket[]>(
      "SELECT * FROM challenge_result WHERE uid = ? LIMIT 1;",
      [req.params.challenge_uid]
    );

    await conn.end();

    return res.json({
      message: "Get Challenge Result By Id",
      Challenge: chall[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getChallengeResultByIdChallenge = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();
    const challengeResults = await conn.query<RowDataPacket[]>(
      `SELECT cr.*,
       u.username AS username,
       (
         SELECT COUNT(*) FROM challenge_result x
          WHERE cr.temps_execution >= x.temps_execution
            AND CAST(cr.resultat_obtenu AS DECIMAL(4,3) ) <= CAST(x.resultat_obtenu AS DECIMAL(4,3))
          AND challenge_id = '${req.params.challenge_uid}'
       ) AS position
       FROM challenge_result cr
        INNER JOIN person p on cr.user_id = p.uid
        INNER JOIN users u on p.uid = u.person_uid
        WHERE challenge_id = '${req.params.challenge_uid}' ORDER BY position ASC;`
    );

    await conn.end();

    return res.json({
      message: "Get Challenge Result By Id",
      ChallengeResults: challengeResults[0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getChallengeResultByChallengeAndUserId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();
    const challengeResults = await conn.query<RowDataPacket[]>(
      `SELECT cr.*,  u.username AS username
        FROM challenge_result cr
          INNER JOIN person p on cr.user_id = p.uid
          INNER JOIN users u on p.uid = u.person_uid
        WHERE challenge_id = '${req.params.challenge_uid}' 
          AND user_id = '${req.params.user_uid}' 
        ORDER BY temps_execution ASC;`
    );

    await conn.end();
    return res.json({
      message: "Get Challenge Result By userId and challengeId",
      ChallengeResults: challengeResults[0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};
