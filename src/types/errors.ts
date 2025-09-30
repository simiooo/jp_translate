// Error Response Structure
export interface ErrorResponse {
  success: false;
  code: number;
  message: string;
  details?: unknown;
  timestamp?: string;
  request_id?: string;
}

// Authentication Errors (1000-1099)
export const ErrCodeMissingAuthHeader = 1001;
export const ErrCodeInvalidAuthFormat = 1002;
export const ErrCodeInvalidToken = 1003;
export const ErrCodeTokenExpired = 1004;
export const ErrCodeTokenClaims = 1005;
export const ErrCodeUserNotAuthenticated = 1006;

// Authorization Errors (1100-1199)
export const ErrCodeInsufficientPermissions = 1101;
export const ErrCodeAdminRequired = 1102;
export const ErrCodeModeratorRequired = 1103;
export const ErrCodeUserNotFound = 1104;
export const ErrCodeAccessDenied = 1105;

// Subscription Errors (1200-1299)
export const ErrCodeSubscriptionNotFound = 1201;
export const ErrCodeSubscriptionNotActive = 1202;
export const ErrCodeSubscriptionExpired = 1203;
export const ErrCodeSubscriptionInvalid = 1204;

// Usage Limit Errors (1300-1399)
export const ErrCodeTranslationLimitReached = 1301;
export const ErrCodeTTSLimitReached = 1302;
export const ErrCodeDailyLimitExceeded = 1303;
export const ErrCodeUsageStatsNotFound = 1304;

// User Management Errors (1400-1499)
export const ErrCodeUsernameExists = 1401;
export const ErrCodeEmailExists = 1402;
export const ErrCodeInvalidCredentials = 1403;
export const ErrCodePasswordTooWeak = 1404;
export const ErrCodeUserCreationFailed = 1405;
export const ErrCodeInvalidOldPassword = 1406;

// File Upload Errors (1500-1599)
export const ErrCodeNoFileProvided = 1501;
export const ErrCodeFileTooLarge = 1502;
export const ErrCodeUnsupportedFileType = 1503;
export const ErrCodeFileUploadFailed = 1504;
export const ErrCodeFileNotFound = 1505;
export const ErrCodeFileDeleteFailed = 1506;
export const ErrCodeAvatarNotFound = 1507;
export const ErrCodeMissingFile = 1508;
export const ErrCodeInvalidFileUpload = 1509;
export const ErrCodeFileSizeExceeded = 1510;
export const ErrCodeInvalidFileType = 1511;
export const ErrCodeFileProcessingError = 1512;
export const ErrCodeImageProcessingError = 1513;

// Payment Errors (1600-1699)
export const ErrCodePaymentCreationFailed = 1601;
export const ErrCodePaymentNotFound = 1602;
export const ErrCodePaymentProcessingFailed = 1603;
export const ErrCodeRefundFailed = 1604;
export const ErrCodeInvalidPaymentProvider = 1605;

// Translation Errors (1700-1799)
export const ErrCodeTranslationFailed = 1701;
export const ErrCodeTranslationTimeout = 1702;
export const ErrCodeInvalidSourceText = 1703;
export const ErrCodeUnsupportedLanguage = 1704;
export const ErrCodeTranslationNotFound = 1705;

// TTS Errors (1800-1899)
export const ErrCodeTTSFailed = 1801;
export const ErrCodeTTSTimeout = 1802;
export const ErrCodeInvalidTTSText = 1803;
export const ErrCodeTTSServiceUnavailable = 1804;

// Database Errors (1900-1999)
export const ErrCodeDatabaseConnection = 1901;
export const ErrCodeDatabaseTransaction = 1902;
export const ErrCodeDatabaseQuery = 1903;
export const ErrCodeRecordNotFound = 1904;
export const ErrCodeRecordCreationFailed = 1905;
export const ErrCodeRecordUpdateFailed = 1906;
export const ErrCodeRecordDeleteFailed = 1907;

// Validation Errors (2000-2099)
export const ErrCodeInvalidRequestBody = 2001;
export const ErrCodeValidationFailed = 2002;
export const ErrCodeInvalidParameter = 2003;
export const ErrCodeMissingRequiredField = 2004;

// System Errors (2100-2199)
export const ErrCodeInternalServerError = 2101;
export const ErrCodeServiceUnavailable = 2102;
export const ErrCodeConfigurationError = 2103;
export const ErrCodeExternalServiceError = 2104;

// Error code categories for easier checking
export const ErrorCategories = {
  AUTHENTICATION: [1001, 1002, 1003, 1004, 1005, 1006],
  AUTHORIZATION: [1101, 1102, 1103, 1104, 1105],
  SUBSCRIPTION: [1201, 1202, 1203, 1204],
  USAGE_LIMIT: [1301, 1302, 1303, 1304],
  USER_MANAGEMENT: [1401, 1402, 1403, 1404, 1405, 1406],
  FILE_UPLOAD: [1501, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1512, 1513],
  PAYMENT: [1601, 1602, 1603, 1604, 1605],
  TRANSLATION: [1701, 1702, 1703, 1704, 1705],
  TTS: [1801, 1802, 1803, 1804],
  DATABASE: [1901, 1902, 1903, 1904, 1905, 1906, 1907],
  VALIDATION: [2001, 2002, 2003, 2004],
  SYSTEM: [2101, 2102, 2103, 2104],
};

// Helper function to check if error code belongs to a category
export const isErrorInCategory = (code: number, category: keyof typeof ErrorCategories): boolean => {
  return ErrorCategories[category].includes(code);
};

// Helper function to get error category name
export const getErrorCategory = (code: number): string | null => {
  for (const [category, codes] of Object.entries(ErrorCategories)) {
    if (codes.includes(code)) {
      return category.toLowerCase();
    }
  }
  return null;
};