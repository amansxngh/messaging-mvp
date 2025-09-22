const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

class MessagingService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their personal room
      socket.on('join-user', async (userId) => {
        try {
          socket.userId = userId;
          socket.join(`user-${userId}`);
          
          // Update user online status
          await User.findByIdAndUpdate(userId, { 
            isOnline: true, 
            lastSeen: new Date() 
          });
          
          console.log(`User ${userId} joined their room`);
        } catch (error) {
          console.error('Error joining user:', error);
        }
      });

      // Join chat room
      socket.on('join-chat', async (chatId) => {
        try {
          socket.join(`chat-${chatId}`);
          console.log(`User joined chat: ${chatId}`);
        } catch (error) {
          console.error('Error joining chat:', error);
        }
      });

      // Send message
      socket.on('send-message', async (data) => {
        try {
          const { chatId, content, type = 'text', mediaUrl = null, replyTo = null } = data;
          
          // Create message
          const message = new Message({
            sender: socket.userId,
            chat: chatId,
            content,
            type,
            mediaUrl,
            replyTo,
            status: 'sent'
          });

          await message.save();

          // Populate sender info
          await message.populate('sender', 'name phoneNumber profilePicture');

          // Update chat last message and activity
          await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            lastActivity: new Date()
          });

          // Emit to all users in the chat
          this.io.to(`chat-${chatId}`).emit('new-message', message);

          // Update message status to delivered
          setTimeout(async () => {
            message.status = 'delivered';
            await message.save();
            this.io.to(`chat-${chatId}`).emit('message-status', {
              messageId: message._id,
              status: 'delivered'
            });
          }, 1000);

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      });

      // Mark messages as read
      socket.on('mark-read', async (data) => {
        try {
          const { chatId, messageIds } = data;
          
          await Message.updateMany(
            { _id: { $in: messageIds }, chat: chatId },
            { status: 'read' }
          );

          // Notify other users in chat
          socket.to(`chat-${chatId}`).emit('messages-read', {
            messageIds,
            readBy: socket.userId
          });

        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        const { chatId, isTyping } = data;
        socket.to(`chat-${chatId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping
        });
      });

      // Disconnect
      socket.on('disconnect', async () => {
        try {
          if (socket.userId) {
            // Update user offline status
            await User.findByIdAndUpdate(socket.userId, { 
              isOnline: false,
              lastSeen: new Date()
            });
            
            console.log(`User ${socket.userId} disconnected`);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });
  }

  // Get chat messages
  async getChatMessages(chatId, page = 1, limit = 50) {
    try {
      const messages = await Message.find({ chat: chatId })
        .populate('sender', 'name phoneNumber profilePicture')
        .populate('replyTo')
        .sort({ timestamp: -1 })
        .limit(limit * page)
        .lean();

      return messages.reverse();
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // Create or get private chat
  async getOrCreatePrivateChat(user1Id, user2Id) {
    try {
      // Check if chat already exists
      let chat = await Chat.findOne({
        type: 'private',
        participants: {
          $all: [
            { user: user1Id },
            { user: user2Id }
          ]
        }
      }).populate('participants.user', 'name phoneNumber profilePicture');

      if (!chat) {
        // Create new private chat
        chat = new Chat({
          name: 'Private Chat',
          type: 'private',
          participants: [
            { user: user1Id, role: 'member' },
            { user: user2Id, role: 'member' }
          ]
        });

        await chat.save();
        await chat.populate('participants.user', 'name phoneNumber profilePicture');
      }

      return chat;
    } catch (error) {
      console.error('Error creating/getting private chat:', error);
      throw error;
    }
  }

  // Get user chats
  async getUserChats(userId) {
    try {
      const chats = await Chat.find({
        participants: { $elemMatch: { user: userId } },
        isActive: true
      })
        .populate('participants.user', 'name phoneNumber profilePicture isOnline lastSeen')
        .populate('lastMessage')
        .sort({ lastActivity: -1 });

      return chats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }
}

module.exports = MessagingService;
