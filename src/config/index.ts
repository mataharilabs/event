export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://event.asiacommerce.net";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export const REGISTRATION_CODE_PREFIX = "AC";

export const SHORT_CODE_LENGTH = 8;

export const OTP_EXPIRY_MINUTES = 5;

export const OTP_MAX_ATTEMPTS = 3;

export const MAX_FILE_SIZE_MB = 5;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export const PAGINATION_DEFAULT_LIMIT = 20;

export const PAGINATION_MAX_LIMIT = 100;
