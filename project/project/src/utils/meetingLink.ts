export const generateMeetingLink = (sessionId: string): string => {
  // Using Jitsi Meet which is free and open source
  const roomName = `training-session-${sessionId}`;
  return `https://meet.jit.si/${roomName}`;
};

export const openMeeting = (meetingLink: string): void => {
  window.open(meetingLink, '_blank', 'noopener,noreferrer');
};