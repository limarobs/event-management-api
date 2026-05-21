const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || 'uploads/materials');

// Garante que o diretório existe
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
];

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_UPLOAD_MB || '50', 10);

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = crypto.randomBytes(16).toString('hex');
        cb(null, `${unique}${ext}`);
    }

});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const err = new Error(
            `Tipo de arquivo não permitido: ${file.mimetype}. ` +
            `Formatos aceitos: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, imagens, TXT, ZIP.`
        );
        err.status = 415;
        cb(err);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024
    }
});

module.exports = {
    upload,
    UPLOADS_DIR
};