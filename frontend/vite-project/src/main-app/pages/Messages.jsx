// This file is kept for backward compatibility
// Use the new message components from features/messaging instead
import { MessagesPage } from '../features/messaging';
import '../../styles/main-app/pages/Messages.scss';

// Define a simple wrapper component for backward compatibility
const MessageWrapper = ({ userId, token }) => {
  return <MessagesPage userId={userId} token={token} />;
};

export default MessageWrapper;
