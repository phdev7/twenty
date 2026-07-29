export const MEETING_TRANSCRIPT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'b3b6ef1b-b08d-4959-8c77-5e865663fe58';

// Short enough to reject a pasted sentence, long enough to accept a ten-minute
// call. Below the floor it is a note, not a meeting.
export const MEETING_TRANSCRIPT_MIN_LENGTH = 200;

// A two-hour meeting transcribes to roughly 60k characters. The ceiling exists so
// one paste cannot become an unbounded row.
export const MEETING_TRANSCRIPT_MAX_LENGTH = 400_000;

export const MEETING_TRANSCRIPT_CANDIDATE_LIMIT = 8;
