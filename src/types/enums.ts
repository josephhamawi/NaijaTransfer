// App-level enum types (SQLite doesn't support DB enums)
// These match the string values stored in the database

export type UserTier = "FREE" | "PRO" | "BUSINESS";
export type TransferType = "LINK" | "EMAIL";
export type TransferStatus = "UPLOADING" | "PROCESSING" | "ACTIVE" | "EXPIRED" | "DELETED";
export type PaymentType = "SUBSCRIPTION" | "ONE_TIME";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type FileRequestStatus = "OPEN" | "CLOSED";
export type ApiKeyTier = "FREE" | "PRO" | "BUSINESS";
