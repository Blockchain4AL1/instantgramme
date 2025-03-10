import { Request, Response } from "express";
import path from "path";
import fs from "fs-extra";
import bcrypt from "bcrypt-nodejs";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket } from "mysql2";
import { connect } from "../lib/connection";
import {
  IChangePassword,
  IUpdateProfile,
  User,
  INewFriend,
  IAcceptFollowerRequest,
} from "../interfaces/user_interface";

export const createUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { username, fullname, email, password, firstname, lastname }: User = req.body;

    const conn = await connect();
    
    const [existsUsername] = await conn.query<RowDataPacket[]>(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );

    if (existsUsername.length > 0) {
      return res.status(401).json({
        message: "username already used!",
      });
    }

    const [existsEmail] = await conn.query<RowDataPacket[]>(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existsEmail.length > 0) {
      return res.status(401).json({
        message: "email already used!",
      });
    }


    const salt = bcrypt.genSaltSync();
    const pass = bcrypt.hashSync(password, salt);

    const randomNumber = Math.floor(10000 + Math.random() * 90000);

    await conn.query(`Insert Into users (uid,
                   description, username, email, password, firstname, lastname, person_uid, is_private) values (?,?,?,?,?,?,?,?,?);`, [
      uuidv4(),
      fullname,
      username,
      email,
      pass,
      firstname,
      lastname,
      uuidv4(),
      1,
    ]);
    conn.end();


    return res.status(201).json({
      message: "Registered user successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const [userdb] = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_USER_BY_ID(?);`,
      [req.idPerson]
    );

    const posters = await conn.query<RowDataPacket[]>(
      "	SELECT COUNT(person_uid) AS posters FROM posts WHERE person_uid = ?",
      [req.idPerson]
    );
    const friends = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(person_uid) AS friends FROM friends WHERE person_uid = ?",
      [req.idPerson]
    );
    const followers = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(person_uid) AS followers FROM followers WHERE person_uid = ?",
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get User by id",
      user: userdb[0][0],
      posts: {
        posters: posters[0][0].posters,
        friends: friends[0][0].friends,
        followers: followers[0][0].followers,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const updatePictureCover = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const cover = req.file?.filename;

    const conn = await connect();

    const imagedb = await conn.query<RowDataPacket[]>(
      "SELECT cover FROM person WHERE uid = ? LIMIT 1",
      [req.idPerson]
    );

    if (imagedb[0][0].cover != null) {
      await fs.unlink(
        path.resolve("uploads/profile/cover/" + imagedb[0][0].cover)
      );
    }

    await conn.query("UPDATE person SET cover = ? WHERE uid = ?", [
      cover,
      req.idPerson,
    ]);

    conn.end();

    return res.json({
      message: "Updated Cover",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const updatePictureProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const profilePath = req.file?.filename;

    const conn = await connect();

    const imagedb = await conn.query<RowDataPacket[]>(
      "SELECT image FROM person WHERE uid = ? LIMIT 1",
      [req.idPerson]
    );

    if (imagedb[0].length > 0) {
      if (imagedb[0][0].image != "avatar-default.png") {
        await fs.unlink(path.resolve("uploads/profile/" + imagedb[0][0].image));
      }
    }

    await conn.query("UPDATE person SET image = ? WHERE uid = ?", [
      profilePath,
      req.idPerson,
    ]);

    conn.end();

    return res.json({
      message: "Updated Profile",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { user, description, fullname, phone }: IUpdateProfile = req.body;

    const conn = await connect();

    await conn.query(
      "UPDATE users SET username = ?, description = ? WHERE person_uid = ?",
      [user, description, req.idPerson]
    );

    await conn.query(
      "UPDATE person SET fullname = ?, phone = ? WHERE uid = ?",
      [fullname, phone, req.idPerson]
    );

    conn.end();

    return res.json({
      message: "updated profile",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { currentPassword, newPassword }: IChangePassword = req.body;

    const conn = await connect();

    const passdb = await conn.query<RowDataPacket[]>(
      "SELECT passwordd FROM users WHERE person_uid = ?",
      [req.idPerson]
    );

    if (!bcrypt.compareSync(currentPassword, passdb[0][0].passwordd)) {
      return res.status(400).json({
        message: "The password does not match",
      });
    }

    const salt = bcrypt.genSaltSync();
    const newPass = bcrypt.hashSync(newPassword, salt);

    await conn.query("UPDATE users SET passwordd = ? WHERE person_uid = ?", [
      newPass,
      req.idPerson,
    ]);

    conn.end();

    return res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const changeAccountPrivacy = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const accountdb = await conn.query<RowDataPacket[]>(
      "SELECT is_private FROM users WHERE person_uid = ? LIMIT 1",
      [req.idPerson]
    );

    if (accountdb[0][0].is_private == 1) {
      await conn.query("UPDATE users SET is_private = ? WHERE person_uid = ?", [
        0,
        req.idPerson,
      ]);
    } else {
      await conn.query("UPDATE users SET is_private = ? WHERE person_uid = ?", [
        1,
        req.idPerson,
      ]);
    }

    conn.end();

    return res.json({
      message: "Account changed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getSearchUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const userdb = await conn.query<RowDataPacket[]>(
      `CALL SP_SEARCH_USERNAME(?);`,
      [req.params.username]
    );

    conn.end();

    return res.json({
      message: "User search",
      userFind: userdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAnotherUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const [userdb] = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_USER_BY_ID(?);`,
      [req.params.idUser]
    );

    const posters = await conn.query<RowDataPacket[]>(
      "	SELECT COUNT(person_uid) AS posters FROM posts WHERE person_uid = ?",
      [req.params.idUser]
    );
    const friends = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(person_uid) AS friends FROM friends WHERE person_uid = ?",
      [req.params.idUser]
    );
    const followers = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(person_uid) AS followers FROM followers WHERE person_uid = ?",
      [req.params.idUser]
    );
    const posts = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_POST_BY_IDPERSON(?);`,
      [req.params.idUser]
    );
    const isFollowing = await conn.query<RowDataPacket[]>(
      "CALL SP_IS_FRIEND(?,?);",
      [req.idPerson, req.params.idUser]
    );
    const isPendingFollowers = await conn.query<RowDataPacket[]>(
      `CALL SP_IS_PENDING_FOLLOWER(?,?)`,
      [req.params.idUser, req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get Another User by id",
      anotherUser: userdb[0][0],
      analytics: {
        posters: posters[0][0].posters,
        friends: friends[0][0].friends,
        followers: followers[0][0].followers,
      },
      postsUser: posts[0][0],
      is_friend: isFollowing[0][0][0].is_friend,
      isPendingFollowers: isPendingFollowers[0][0][0].is_pending_follower,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const AddNewFollowing = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidFriend }: INewFriend = req.body;

    const conn = await connect();

    const isPrivateAccount = await conn.query<RowDataPacket[]>(
      "SELECT is_private FROM users WHERE person_uid = ?",
      [uidFriend]
    );

    if (!isPrivateAccount[0][0].is_private) {
      await conn.query(
        "INSERT INTO friends (uid, person_uid, friend_uid) VALUE (?,?,?)",
        [uuidv4(), req.idPerson, uidFriend]
      );

      await conn.query(
        "INSERT INTO followers (uid, person_uid, followers_uid) VALUE (?,?,?)",
        [uuidv4(), uidFriend, req.idPerson]
      );

      conn.end();

      return res.json({
        message: "New friend",
      });
    }

    await conn.query(
      "INSERT INTO notifications (uid_notification, type_notification, user_uid, followers_uid) VALUE (?,?,?,?)",
      [uuidv4(), "1", uidFriend, req.idPerson]
    );

    conn.end();

    return res.json({
      message: "New friend",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const AcceptFollowerRequest = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidFriend, uidNotification }: IAcceptFollowerRequest = req.body;

    const conn = await connect();

    await conn.query(
      "INSERT INTO friends (uid, person_uid, friend_uid) VALUE (?,?,?)",
      [uuidv4(), uidFriend, req.idPerson]
    );

    await conn.query(
      "INSERT INTO followers (uid, person_uid, followers_uid) VALUE (?,?,?)",
      [uuidv4(), req.idPerson, uidFriend]
    );

    await conn.query(
      "UPDATE notifications SET type_notification = ? WHERE uid_notification = ?",
      ["3", uidNotification]
    );

    conn.end();

    return res.json({
      message: "New friend",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const deleteFollowing = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    await conn.query(
      "DELETE FROM friends WHERE person_uid = ? AND friend_uid = ?",
      [req.idPerson, req.params.idUser]
    );

    await conn.query(
      "DELETE FROM followers WHERE person_uid = ? AND followers_uid = ?",
      [req.params.idUser, req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Deleted friend",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllFollowings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const followings = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_FOLLOWING(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get All Following",
      followings: followings[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllFollowers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const followers = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_FOLLOWERS(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get All Following",
      followers: followers[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const deleteFollowers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    await conn.query(
      "DELETE FROM friends WHERE person_uid = ? AND friend_uid = ?",
      [req.params.idUser, req.idPerson]
    );

    await conn.query(
      "DELETE FROM followers WHERE person_uid = ? AND followers_uid = ?",
      [req.idPerson, req.params.idUser]
    );

    await conn.query(
      "DELETE FROM notifications WHERE type_notification = 3 AND user_uid = ? AND followers_uid = ?",
      [req.idPerson, req.params.idUser]
    );

    conn.end();

    return res.json({
      message: "Deleted friend",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const updateOnlineUser = async (uid: string) => {
  const conn = await connect();

  await conn.query("UPDATE users SET is_online = true WHERE person_uid = ?", [
    uid,
  ]);

  conn.end();
};

export const updateOfflineUser = async (uid: string) => {
  const conn = await connect();

  await conn.query("UPDATE users SET is_online = false WHERE person_uid = ?", [
    uid,
  ]);

  conn.end();
};
