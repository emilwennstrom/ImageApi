import mongoose from "mongoose";
import { Image } from "../models/image.js"
import fs from 'fs'


export const newImage = async (req, res, next) => {
    try {
        const patientId = req.body.patientId;
        const filePath = req.file.path

        let image = await Image.findOne({patientId: patientId})

        if (image){
            image.imagePath.push(filePath)

        // if not, create a new object
        } else {
            image = new Image({
                _id: new mongoose.Types.ObjectId(),
                patientId: patientId,
                imagePath: [filePath]
            });
        }
        await image.save();
        
        res.json({message: "Image saved successfully"});
    } catch (error) {

        console.error("Error saveing image to db", error)
        res.status(500).json({message: "Failed to save image"})

        fs.unlink(filePath, (err) => {
            if (err) console.error("Error removing file", err);
        });

        next(error)
    }
}


export const getUserImages = async (req, res, next) => {
    try {
        const patientId = req.query.patientId;
        let images = await Image.findOne({patientId: patientId});

        if (!images || !images.imagePath || images.imagePath.length === 0) {
            return res.status(404).json({ message: "No images for that user found" });
        }
        // returns the url for the image (not the image itself)
        const imageUrls = images.imagePath.map(path => `${req.protocol}://${req.get('host')}/${path}`);
        res.json({ 
            patientId: patientId,
            imageUrls: imageUrls });
    } catch (error) {
        next(error)
    }
}

export const deleteAllUserImages = async (req, res, next) => {
    try {
        const patientId = req.params.patientId
        let userImages = await Image.findOne({patientId: patientId});


        if (userImages && userImages.imagePath.length > 0) {
            userImages.imagePath.forEach(path => {
                fs.unlink(path, (err) => {
                    if (err) {
                        console.log("Error deleting file (might have not existed)", err)
                    }
                });
            });

            userImages.imagePath = [];
            await userImages.save();
            res.status(200).json({message: "All images deleted for user ", patientId})
        } else {
            res.status(404).json({message: "No images found for the user ", patientId })
        }


    } catch (error) {
        next(error)
    }
}

export const deleteUserImage = async (req, res, next) => {
    try {
        const patientId = req.query.patientId
        const imagePath = req.query.imagePath

        let userImages = await Image.findOne({patientId: patientId});

        if (userImages && imagePath.length > 0) {
            if (userImages.imagePath.includes(imagePath)) {
                userImages.imagePath = userImages.imagePath.filter(path => path !== imagePath)

                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({message: "Error deleting file"});
                        return;
                    }
                })

                await userImages.save();
                res.status(200).json({message: "Image deleted successfully"});
            } else {
                res.status(404).json({message: "Image path was not found for that user"})
            }
        }
    } catch (error) {
        next(error)
    }
}




