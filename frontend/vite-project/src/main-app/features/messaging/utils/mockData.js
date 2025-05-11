export const conversations = [
  {
    id: "user1",
    name: "Ahmed Rufai",
    avatar: "/src/assets/msg_images/msg1.avif",
    previewMessage: "Continuing our discussion on my availability",
    lastActive: "Today, Jan 30",
    isActive: true,
    lastMessage: {
      text: "Continuing our discussion on my availability",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: "read"
    }
  },
  {
    id: "user2",
    name: "Chloe Mary",
    avatar: "/src/assets/msg_images/msg2.avif",
    previewMessage: "When can we schedule our next appointment?",
    lastActive: "Yesterday, Jan 29",
    isActive: false,
    lastMessage: {
      text: "When can we schedule our next appointment?",
      timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      status: "delivered"
    }
  },
  {
    id: "user3",
    name: "Ruben James",
    avatar: "/src/assets/msg_images/msg3.avif",
    previewMessage: "Thanks for sending the medical report",
    lastActive: "Jan 28",
    isActive: false,
    lastMessage: {
      text: "Thanks for sending the medical report",
      timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      status: "sent"
    }
  },
  {
    id: "user4",
    name: "Kaitlyn Rose",
    avatar: "/src/assets/msg_images/msg4.avif",
    previewMessage: "Could you recommend a good specialist?",
    lastActive: "Jan 27",
    isActive: false,
    lastMessage: {
      text: "Could you recommend a good specialist?",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
      status: "read"
    }
  },
  {
    id: "user5",
    name: "Mary Huggins",
    avatar: "/src/assets/msg_images/msg5.avif",
    previewMessage: "I've been feeling much better since our last session",
    lastActive: "Jan 26",
    isActive: false,
    lastMessage: {
      text: "I've been feeling much better since our last session",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
      status: "read"
    }
  },
  {
    id: "user6",
    name: "Karl Jude",
    avatar: "/src/assets/msg_images/msg6.avif", 
    previewMessage: "Is there anything I should prepare for our next appointment?",
    lastActive: "Jan 25",
    isActive: false,
    lastMessage: {
      text: "Is there anything I should prepare for our next appointment?",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60000).toISOString(),
      status: "read"
    }
  },
  {
    id: "user7",
    name: "Frederick Jones",
    avatar: "/src/assets/msg_images/msg7.avif",
    previewMessage: "My prescription is running low, can we discuss options?",
    lastActive: "Jan 24",
    isActive: false,
    lastMessage: {
      text: "My prescription is running low, can we discuss options?",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
      status: "read"
    }
  },
  {
    id: "user8",
    name: "Kelly Rowland",
    avatar: "/src/assets/msg_images/msg8.avif",
    previewMessage: "Just wanted to check in about my progress",
    lastActive: "Jan 23",
    isActive: false,
    lastMessage: {
      text: "Just wanted to check in about my progress",
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60000).toISOString(),
      status: "read"
    }
  }
];

export const messageHistory = {
  user1: [
    {
      senderId: "user1",
      text: "Good morning! I wanted to discuss my availability for next week.",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "currentUser",
      text: "Good morning Ahmed! I'm available Monday through Wednesday next week.",
      timestamp: new Date(Date.now() - 58 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user1",
      text: "Perfect, could we schedule for Tuesday at 2pm?",
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "currentUser",
      text: "Tuesday at 2pm works well for me. I'll block that time on my calendar.",
      timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user1",
      text: "Great! I'll prepare my questions beforehand.",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "currentUser",
      text: "That would be helpful. Feel free to send them over if you'd like me to think about them in advance.",
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user1",
      text: "Continuing our discussion on my availability, I also wanted to ask about your services for my elderly mother.",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: "read"
    }
  ],
  user2: [
    {
      senderId: "user2",
      text: "Hello, I hope you're doing well today!",
      timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
      status: "delivered"
    },
    {
      senderId: "currentUser",
      text: "Hi Chloe, I'm doing great, thank you for asking! How are you?",
      timestamp: new Date(Date.now() - 4.9 * 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user2",
      text: "I'm good as well. I was wondering if we could discuss scheduling our next appointment?",
      timestamp: new Date(Date.now() - 4.8 * 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "currentUser",
      text: "Absolutely! I have some availability next week on Monday and Thursday afternoons.",
      timestamp: new Date(Date.now() - 4.7 * 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user2",
      text: "Thursday afternoon would work perfectly for me. Does 3pm work?",
      timestamp: new Date(Date.now() - 4.5 * 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "currentUser",
      text: "3pm on Thursday is perfect. I'll mark it in my calendar!",
      timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      status: "read"
    },
    {
      senderId: "user2",
      text: "When can we schedule our next appointment? I was thinking maybe earlier next week.",
      timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      status: "delivered"
    }
  ]
};

// Function to generate mock conversation data with timestamps and status
export const generateMockConversation = (userId, currentUserId, messageCount = 10) => {
  const messages = [];
  let lastTimestamp = Date.now() - (messageCount * 5 * 60000); // Start 5 minutes ago * message count
  
  for (let i = 0; i < messageCount; i++) {
    const senderId = i % 2 === 0 ? userId : currentUserId;
    const timestamp = new Date(lastTimestamp + (i * 5 * 60000)).toISOString();
    const status = senderId === currentUserId ? 
      (Math.random() > 0.3 ? 'read' : 'delivered') : 
      'received';
      
    messages.push({
      id: `msg-${userId}-${i}`,
      senderId,
      text: `This is message ${i + 1} in the conversation. ${i % 3 === 0 ? 'How are you doing today?' : i % 3 === 1 ? 'I hope you are well!' : 'Let me know if you need anything else.'}`,
      timestamp,
      status
    });
  }
  
  return messages;
};
