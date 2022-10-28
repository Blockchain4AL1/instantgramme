import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { connect } from "../lib/connection";
import {
  ILikePost,
  INewComment,
  INewPost,
  ISavePost,
  IUidComment,
  LikePost,
} from "../interfaces/post_interface";
import { RowDataPacket } from "mysql2";

export const createNewPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { comment, type_privacy, title, description }: INewPost = req.body;
    const files = req.files as Express.Multer.File[];

    const conn = await connect();

    const uidPost = uuidv4();
    const post_save_uids = uuidv4();

    await conn.query(
      "INSERT INTO posts (uid, type_privacy, person_uid , title, description) value (?,?,?,?,?)",
      [uidPost, type_privacy, req.idPerson, title, description]
    );

    await conn.query(
      "INSERT INTO comments (uid, comment, person_uid, post_uid) VALUE (?,?,?,?)",
      [uuidv4(), comment, req.idPerson, uidPost]
    );

    await conn.query(
      "INSERT INTO post_save(post_save_uid, post_uid, person_uid) VALUE (?,?,?)",
      [post_save_uids, uidPost, req.idPerson]
    );

    files.forEach(async (img) => {
      await conn.query(
        "INSERT INTO images_post (uid, image, post_uid) VALUES (?,?,?)",
        [uuidv4(), img.filename, uidPost]
      );
    });

    return res.json({
      message: "Posted",
      post_uid: uidPost
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllPostHome = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_POSTS_HOME();`
    );

    const imagesdb = postdb[0][0].testing;

    await conn.end();

    return res.json({
      message: "Get All Post",
      posts: postdb[0][0],
      imagesdb,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};


export const getPostByIdPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_POST_BY_ID(?);`,
      [req.params.uidPost]
    );

    const imagesdb = postdb[0][0].testing;

    await conn.end();

    return res.json({
      message: "Get Post By Id",
      posts: postdb[0][0],
      imagesdb,
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};


export const getPostByIdPerson = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_POST_BY_ID_PERSON(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get Posts by IdPerson",
      post: postdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const savePostByUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { post_uid }: ISavePost = req.body;

    const conn = await connect();

    await conn.query(
      "INSERT INTO post_save(post_save_uid, post_uid, person_uid) VALUE (?,?,?)",
      [uuidv4(), post_uid, req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Posted save",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getListSavedPostsByUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const listSavedPost = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_LIST_POST_SAVED_BY_USER(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "List Saved Post",
      listSavedPost: listSavedPost[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllPostsForSearch = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postsdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_POSTS_FOR_SEARCH(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Get All Post For Search",
      posts: postsdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const likeOrUnLikePost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidPost, uidPerson }: ILikePost = req.body;

    const conn = await connect();

    const isLikedb = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(uid_likes) AS uid_likes FROM likes WHERE user_uid = ? AND post_uid = ? LIMIT 1",
      [req.idPerson, uidPost]
    );

    if (isLikedb[0][0].uid_likes > 0) {
      await conn.query(
        "DELETE FROM likes WHERE user_uid = ? AND post_uid = ?",
        [req.idPerson, uidPost]
      );

      await conn.query(
        "DELETE FROM notifications WHERE type_notification = 2 AND user_uid = ? AND post_uid = ?",
        [uidPerson, uidPost]
      );

      conn.end();

      return res.json({
        message: "unlike",
      });
    }

    await conn.query(
      "INSERT INTO likes (uid_likes, user_uid, post_uid) VALUE (?,?,?)",
      [uuidv4(), req.idPerson, uidPost]
    );

    await conn.query(
      "INSERT INTO notifications (uid_notification, type_notification, user_uid, followers_uid, post_uid) VALUE (?,?,?,?,?)",
      [uuidv4(), 2, uidPerson, req.idPerson, uidPost]
    );

    conn.end();

    return res.json({
      message: "like",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getListCommentsByIdPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const commentsdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_COMMNETS_BY_UIDPOST(?);`,
      [req.params.uidPost]
    );

    conn.end();

    return res.json({
      message: "Get Commets",
      comments: commentsdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const addNewComment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidPost, comment }: INewComment = req.body;

    const conn = await connect();

    await conn.query(
      "INSERT INTO comments (uid, comment, person_uid, post_uid) VALUE (?,?,?,?)",
      [uuidv4(), comment, req.idPerson, uidPost]
    );

    conn.end();

    return res.json({
      message: "New comment",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const likeOrUnLikeComment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidComment }: IUidComment = req.body;

    const conn = await connect();

    const isLikedb = await conn.query<RowDataPacket[]>(
      "SELECT is_like FROM comments WHERE uid = ? LIMIT 1",
      [uidComment]
    );

    if (isLikedb[0][0].is_like > 0) {
      await conn.query("UPDATE comments SET is_like = ? WHERE uid = ?", [
        0,
        uidComment,
      ]);

      conn.end();

      return res.json({
        message: "unlike comment",
      });
    }

    await conn.query("UPDATE comments SET is_like = ? WHERE uid = ?", [
      1,
      uidComment,
    ]);

    conn.end();

    return res.json({
      message: "like comment",
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllPostByUserID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postsdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_POST_BY_USER(?);`,
      [req.idPerson]
    );

    conn.end();

    return res.json({
      message: "Posts By User ID",
      postUser: postsdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getAllPostByOtherUserID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const conn = await connect();

    const postsdb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_ALL_POST_BY_USER(?);`,
      [req.params.idPerson]
    );

    conn.end();

    return res.json({
      message: "Posts By User ID",
      postUser: postsdb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};


export const getLikes = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { uidPost }: LikePost = req.body;

    const conn = await connect();

    const Likedb = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(uid_likes) AS uid_likes FROM likes WHERE  post_uid = ? LIMIT 1",
      [uidPost]
    );

    conn.end();

    return res.json({
      message: "Get All likes",
      posts: Likedb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const getLikeUserByPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {

    const conn = await connect();
    const isLikedb = await conn.query<RowDataPacket[]>(
      `CALL SP_GET_LIKE_POST_BY_USER(?,?);`,
      [req.params.uidPost,req.idPerson]
    );

    conn.end();

    return res.json({
      isLikedb: isLikedb[0][0],
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};
