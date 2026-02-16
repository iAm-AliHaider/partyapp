/**
 * Pakistan CNIC Validator
 * Format: XXXXX-XXXXXXX-X (13 digits)
 * First 5 digits = district/location code
 * Last digit: odd = male, even = female
 */

export interface CNICInfo {
  isValid: boolean;
  districtCode: string;
  gender: "MALE" | "FEMALE";
  formatted: string; // XXXXX-XXXXXXX-X
  raw: string; // 13 digits
  error?: string;
}

// Major district CNIC prefixes (first 5 digits)
export const DISTRICT_CODES: Record<string, { district: string; province: string }> = {
  "42101": { district: "Karachi South", province: "Sindh" },
  "42201": { district: "Karachi East", province: "Sindh" },
  "42301": { district: "Karachi Central", province: "Sindh" },
  "42401": { district: "Karachi West", province: "Sindh" },
  "42501": { district: "Malir", province: "Sindh" },
  "42601": { district: "Korangi", province: "Sindh" },
  "41101": { district: "Hyderabad", province: "Sindh" },
  "41201": { district: "Sukkur", province: "Sindh" },
  "41301": { district: "Larkana", province: "Sindh" },
  "35202": { district: "Lahore", province: "Punjab" },
  "35201": { district: "Lahore", province: "Punjab" },
  "35101": { district: "Rawalpindi", province: "Punjab" },
  "35401": { district: "Faisalabad", province: "Punjab" },
  "35301": { district: "Multan", province: "Punjab" },
  "36101": { district: "Gujranwala", province: "Punjab" },
  "36201": { district: "Sialkot", province: "Punjab" },
  "36301": { district: "Sargodha", province: "Punjab" },
  "36401": { district: "Bahawalpur", province: "Punjab" },
  "17101": { district: "Peshawar", province: "KPK" },
  "17201": { district: "Mardan", province: "KPK" },
  "17301": { district: "Abbottabad", province: "KPK" },
  "17401": { district: "Swat", province: "KPK" },
  "54101": { district: "Quetta", province: "Balochistan" },
  "54201": { district: "Zhob", province: "Balochistan" },
  "61101": { district: "Islamabad", province: "ICT" },
  "82101": { district: "Muzaffarabad", province: "AJK" },
  "71101": { district: "Gilgit", province: "GB" },
};

export function validateCNIC(input: string): CNICInfo {
  // Remove dashes and spaces
  const raw = input.replace(/[-\s]/g, "");

  // Must be exactly 13 digits
  if (!/^\d{13}$/.test(raw)) {
    return {
      isValid: false,
      districtCode: "",
      gender: "MALE",
      formatted: "",
      raw: input,
      error: "CNIC must be exactly 13 digits",
    };
  }

  const districtCode = raw.substring(0, 5);
  const lastDigit = parseInt(raw[12]);
  const gender = lastDigit % 2 === 0 ? "FEMALE" : "MALE";
  const formatted = `${raw.substring(0, 5)}-${raw.substring(5, 12)}-${raw[12]}`;

  return {
    isValid: true,
    districtCode,
    gender,
    formatted,
    raw,
  };
}

export function getDistrictFromCNIC(cnic: string): { district: string; province: string } | null {
  const { isValid, districtCode } = validateCNIC(cnic);
  if (!isValid) return null;

  // Try exact match first
  if (DISTRICT_CODES[districtCode]) {
    return DISTRICT_CODES[districtCode];
  }

  // Try first 3 digits for province-level match
  const provincePrefix = districtCode.substring(0, 2);
  const provinceMap: Record<string, string> = {
    "35": "Punjab",
    "36": "Punjab",
    "37": "Punjab",
    "38": "Punjab",
    "41": "Sindh",
    "42": "Sindh",
    "43": "Sindh",
    "44": "Sindh",
    "45": "Sindh",
    "17": "KPK",
    "15": "KPK",
    "16": "KPK",
    "21": "KPK",
    "54": "Balochistan",
    "55": "Balochistan",
    "56": "Balochistan",
    "61": "ICT",
    "82": "AJK",
    "83": "AJK",
    "71": "GB",
    "72": "GB",
  };

  const province = provinceMap[provincePrefix];
  if (province) {
    return { district: "Unknown", province };
  }

  return null;
}

export function formatCNIC(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 13) return raw;
  return `${digits.substring(0, 5)}-${digits.substring(5, 12)}-${digits[12]}`;
}
