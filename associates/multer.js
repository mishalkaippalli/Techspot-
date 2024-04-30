const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/product-images"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// add filter for multer to accept 
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    // cb(new Error('Unsupported file type'), false);

    req.fileFilterError = 'Unsupported file type';
    cb(null, false);
  }
};

const upload = multer({storage:storage, fileFilter: fileFilter });

module.exports = upload;
