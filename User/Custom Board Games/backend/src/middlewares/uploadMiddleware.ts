import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer with the defined storage
const upload = multer({ storage: storage });

// Middleware to handle avatar uploads
export const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err });
    }
    next();
  });
};