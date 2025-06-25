const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Multer memory storage
const multerStorage = multer.memoryStorage();

// Multer filter: only accept images
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

// Multer upload middleware
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});


const uploadUserImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const file = req.file;
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'users' }, // Specify the folder
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(file.buffer);
        });
        req.body.image = result.secure_url;
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
}
// Export the multer upload + cloudinary middleware
exports.uploadUserImage = upload.single('image');
exports.resizeAndUploadUserImage = uploadUserImage;

// Middleware to handle upload and Cloudinary
const uploadImagesToCloudinary = async (req, res, next) => {
    if (!req.files) return next();

    try {
        // 1. Upload imageCover
        if (req.files.imageCover) {
            const file = req.files.imageCover[0];
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image', folder: 'estates' }, // Specify the folder
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(file.buffer);
            });
            req.body.imageCover = result.secure_url;
        }

        // 2. Upload images array
        if (req.files.images) {
            const imagesUploadPromises = req.files.images.map(file => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'image', folder: 'estates' }, // Specify the folder
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
            });

            const uploadedImages = await Promise.all(imagesUploadPromises);
            req.body.images = uploadedImages.map(img => img.secure_url);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Export the multer upload + cloudinary middleware

exports.uploadProductImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 10 },
]);

exports.resizeAndUploadImages = uploadImagesToCloudinary;
