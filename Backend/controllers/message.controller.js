import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReciverSocketId, io } from "../lib/socket.js";
export const getUsersForSidebar = async (req, res)=>{
try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    res.status(200).json(filteredUsers);
} catch (error) {
    console.log("error in getUsersForSidebar controller :", error);
    res.status(500).json({ message: "internal Server Error" });
}
}

export const getMessages  = async (req, res)=>{
    try {
        const { id:userToChatId } = req.params
        const myId = req.user._id

        const messages = await Message.find({
            $or: [
                { senderId: myId, reciverId: userToChatId },
                { senderId: userToChatId, reciverId: myId },
            ],
        })

        res.status(200).json(messages);
    } catch (error) {
        console.log("error in getMessages controller :", error);
        res.status(500).json({ message: "internal Server Error" });
    }
}

export const sendMessage = async (req, res)=>{
    try {
        const {text , image} = req.body
        const { id:reciverId } = req.params
        const senderId = req.user._id

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message({
            senderId,
            reciverId,
            text,
            image:imageUrl
        })
        await newMessage.save()
        const reciverSoketId = getReciverSocketId(reciverId)
        if(reciverSoketId){
            io.to(reciverSoketId).emit("newMessage", newMessage);
        }
        res.status(200).json(newMessage);
        
    } catch (error) {
        console.log("error in sendMessage controller :", error);
        res.status(500).json({ message: "internal Server Error" });
    }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


