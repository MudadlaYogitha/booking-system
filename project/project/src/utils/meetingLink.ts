export const generateMeetingLink = (sessionId: string): string => {
  // Using Jitsi Meet which is free and open source
  const roomName = `training-session-${sessionId}`.replace(/[^a-zA-Z0-9-]/g, '-');
  return `https://meet.jit.si/${roomName}`;
};

export const openMeeting = (meetingLink: string): void => {
  window.open(meetingLink, '_blank', 'noopener,noreferrer');
};

export const extractRoomNameFromJitsiLink = (meetingLink: string): string => {
  const match = meetingLink.match(/meet\.jit\.si\/(.+)$/);
  return match ? match[1] : '';
};