const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: String,
    required: true,
    index: true
  },
  sender_type: {
    type: String,
    required: true,
    enum: ['supervisor', 'department', 'system']
  },
  message: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'complaint_reference', 'status_update', 'urgent_alert'],
    default: 'text'
  },
  complaint_id: {
    type: String,
    index: true
  },
  read_by: [{
    user_id: String,
    read_at: {
      type: Date,
      default: Date.now
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: -1
  }
}, { _id: true });

const supervisorChatSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  supervisor_id: {
    type: String,
    required: true,
    index: true
  },
  department_id: {
    type: String,
    required: true,
    index: true
  },
  chat_name: {
    type: String,
    required: true
  },
  participants: [{
    user_id: String,
    user_type: {
      type: String,
      enum: ['supervisor', 'department']
    },
    joined_at: {
      type: Date,
      default: Date.now
    },
    active: {
      type: Boolean,
      default: true
    }
  }],
  messages: [messageSchema],
  last_activity: {
    type: Date,
    default: Date.now,
    index: -1
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'last_activity' }
});

// Compound indexes
supervisorChatSchema.index({ supervisor_id: 1, department_id: 1 });
supervisorChatSchema.index({ supervisor_id: 1, active: 1, last_activity: -1 });

// Instance methods
supervisorChatSchema.methods.addMessage = function(senderId, senderType, message, messageType = 'text', complaintId = null) {
  const newMessage = {
    sender_id: senderId,
    sender_type: senderType,
    message: message,
    message_type: messageType,
    complaint_id: complaintId,
    timestamp: new Date()
  };

  this.messages.push(newMessage);
  this.last_activity = new Date();
  
  return this.save();
};

supervisorChatSchema.methods.markMessageAsRead = function(messageId, userId) {
  const message = this.messages.id(messageId);
  if (message) {
    const existingRead = message.read_by.find(r => r.user_id === userId);
    if (!existingRead) {
      message.read_by.push({
        user_id: userId,
        read_at: new Date()
      });
      return this.save();
    }
  }
  return Promise.resolve(this);
};

supervisorChatSchema.methods.getUnreadCount = function(userId) {
  let unreadCount = 0;
  
  this.messages.forEach(message => {
    if (message.sender_id !== userId) {
      const hasRead = message.read_by.some(r => r.user_id === userId);
      if (!hasRead) {
        unreadCount++;
      }
    }
  });
  
  return unreadCount;
};

supervisorChatSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .reverse();
};

supervisorChatSchema.methods.addParticipant = function(userId, userType) {
  const existingParticipant = this.participants.find(p => p.user_id === userId);
  
  if (existingParticipant) {
    existingParticipant.active = true;
  } else {
    this.participants.push({
      user_id: userId,
      user_type: userType,
      joined_at: new Date(),
      active: true
    });
  }
  
  return this.save();
};

supervisorChatSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user_id === userId);
  if (participant) {
    participant.active = false;
  }
  return this.save();
};

// Static methods
supervisorChatSchema.statics.createChat = function(supervisorId, departmentId, chatName) {
  const chatId = `CHAT-${supervisorId}-${departmentId}-${Date.now()}`;
  
  const chat = new this({
    chat_id: chatId,
    supervisor_id: supervisorId,
    department_id: departmentId,
    chat_name: chatName,
    participants: [
      {
        user_id: supervisorId,
        user_type: 'supervisor'
      },
      {
        user_id: departmentId,
        user_type: 'department'
      }
    ]
  });
  
  return chat.save();
};

supervisorChatSchema.statics.findChatBetween = function(supervisorId, departmentId) {
  return this.findOne({
    supervisor_id: supervisorId,
    department_id: departmentId,
    active: true
  });
};

supervisorChatSchema.statics.getUserChats = function(userId, userType) {
  const query = {
    active: true,
    'participants.user_id': userId,
    'participants.active': true
  };
  
  return this.find(query)
    .sort({ last_activity: -1 })
    .select('chat_id supervisor_id department_id chat_name last_activity participants messages')
    .lean();
};

supervisorChatSchema.statics.sendUrgentAlert = function(supervisorId, departmentId, complaintId, message) {
  return this.findChatBetween(supervisorId, departmentId)
    .then(chat => {
      if (!chat) {
        // Create new chat if doesn't exist
        return this.createChat(supervisorId, departmentId, `Urgent: ${complaintId}`)
          .then(newChat => {
            return newChat.addMessage('system', 'system', message, 'urgent_alert', complaintId);
          });
      } else {
        return chat.addMessage('system', 'system', message, 'urgent_alert', complaintId);
      }
    });
};

module.exports = mongoose.model('SupervisorChat', supervisorChatSchema);
