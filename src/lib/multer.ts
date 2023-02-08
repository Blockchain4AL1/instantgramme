import path from "path";
import { v4 as uuid } from "uuid";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { mkdirp } from "fs-extra";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Path to store the cover image
const storageCover = multer.diskStorage({
  destination: "uploads/profile/cover",
  filename: (_, file, cb) => {
    cb(null, uuid() + path.extname(file.originalname));
  },
});

// Path to store the Profile image
const storageProfile = multer.diskStorage({
  destination: "uploads/profile",
  filename: (req, file, cb): void => {
    cb(null, uuid() + path.extname(file.originalname));
  },
});

// Path to store the posts images
const storagePost = multer.diskStorage({
  destination: "uploads/posts",
  filename: (_, file, cb): void => {
    cb(null, uuid() + path.extname(file.originalname));
  },
});

export const fileStorage = multer.diskStorage({
  destination: "uploads/profile/cover",

  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ): void => {},
});
export const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/txt" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};
export const uploadsCover = multer({ storage: storageCover, fileFilter });
export const uploadsProfile = multer({ storage: storageProfile, fileFilter });
export const uploadsPost = multer({ storage: storagePost });
