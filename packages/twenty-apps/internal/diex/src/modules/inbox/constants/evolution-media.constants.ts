export const EVOLUTION_MEDIA_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e0c000-0000-4000-8000-000000000008';

export const EVOLUTION_MEDIA_ROUTE = '/diex/inbox/evolution/media';

// Roughly 4.5 MB of binary once decoded. A voice note or a photo from a phone
// fits comfortably; anything past this is a file to open in WhatsApp rather than
// push through an inline data URI.
export const EVOLUTION_MEDIA_MAX_BASE64_BYTES = 6_000_000;
