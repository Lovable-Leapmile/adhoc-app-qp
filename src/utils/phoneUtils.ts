/**
 * Masks a phone number showing only the last 4 digits
 * @param phoneNumber The phone number to mask
 * @returns Masked phone number (e.g., "*******1234")
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || phoneNumber.length < 4) {
    return phoneNumber;
  }
  
  const lastFourDigits = phoneNumber.slice(-4);
  const maskedPart = '*'.repeat(Math.max(0, phoneNumber.length - 4));
  
  return maskedPart + lastFourDigits;
};