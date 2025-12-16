/**
 * Indian States and Union Territories Data
 * 28 States + 8 Union Territories = 36 total
 */

export interface IndianState {
  name: string;
  code: string;
  type: "state" | "union_territory";
  gstStateCode: number; // GST state code (01-38)
}

export const INDIAN_STATES: IndianState[] = [
  // States (28)
  { name: "Andhra Pradesh", code: "AP", type: "state", gstStateCode: 37 },
  { name: "Arunachal Pradesh", code: "AR", type: "state", gstStateCode: 12 },
  { name: "Assam", code: "AS", type: "state", gstStateCode: 18 },
  { name: "Bihar", code: "BR", type: "state", gstStateCode: 10 },
  { name: "Chhattisgarh", code: "CT", type: "state", gstStateCode: 22 },
  { name: "Goa", code: "GA", type: "state", gstStateCode: 30 },
  { name: "Gujarat", code: "GJ", type: "state", gstStateCode: 24 },
  { name: "Haryana", code: "HR", type: "state", gstStateCode: 6 },
  { name: "Himachal Pradesh", code: "HP", type: "state", gstStateCode: 2 },
  { name: "Jharkhand", code: "JH", type: "state", gstStateCode: 20 },
  { name: "Karnataka", code: "KA", type: "state", gstStateCode: 29 },
  { name: "Kerala", code: "KL", type: "state", gstStateCode: 32 },
  { name: "Madhya Pradesh", code: "MP", type: "state", gstStateCode: 23 },
  { name: "Maharashtra", code: "MH", type: "state", gstStateCode: 27 },
  { name: "Manipur", code: "MN", type: "state", gstStateCode: 14 },
  { name: "Meghalaya", code: "ML", type: "state", gstStateCode: 17 },
  { name: "Mizoram", code: "MZ", type: "state", gstStateCode: 15 },
  { name: "Nagaland", code: "NL", type: "state", gstStateCode: 13 },
  { name: "Odisha", code: "OD", type: "state", gstStateCode: 21 },
  { name: "Punjab", code: "PB", type: "state", gstStateCode: 3 },
  { name: "Rajasthan", code: "RJ", type: "state", gstStateCode: 8 },
  { name: "Sikkim", code: "SK", type: "state", gstStateCode: 11 },
  { name: "Tamil Nadu", code: "TN", type: "state", gstStateCode: 33 },
  { name: "Telangana", code: "TG", type: "state", gstStateCode: 36 },
  { name: "Tripura", code: "TR", type: "state", gstStateCode: 16 },
  { name: "Uttar Pradesh", code: "UP", type: "state", gstStateCode: 9 },
  { name: "Uttarakhand", code: "UK", type: "state", gstStateCode: 5 },
  { name: "West Bengal", code: "WB", type: "state", gstStateCode: 19 },

  // Union Territories (8)
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    type: "union_territory",
    gstStateCode: 35,
  },
  { name: "Chandigarh", code: "CH", type: "union_territory", gstStateCode: 4 },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DH",
    type: "union_territory",
    gstStateCode: 26,
  },
  { name: "Delhi", code: "DL", type: "union_territory", gstStateCode: 7 },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    type: "union_territory",
    gstStateCode: 1,
  },
  { name: "Ladakh", code: "LA", type: "union_territory", gstStateCode: 38 },
  {
    name: "Lakshadweep",
    code: "LD",
    type: "union_territory",
    gstStateCode: 31,
  },
  { name: "Puducherry", code: "PY", type: "union_territory", gstStateCode: 34 },
];

/**
 * Get state by name
 */
export function getStateByName(name: string): IndianState | undefined {
  return INDIAN_STATES.find(
    (state) => state.name.toLowerCase() === name.toLowerCase(),
  );
}

/**
 * Get state by code
 */
export function getStateByCode(code: string): IndianState | undefined {
  return INDIAN_STATES.find(
    (state) => state.code.toLowerCase() === code.toLowerCase(),
  );
}

/**
 * Get state by GST state code
 */
export function getStateByGstCode(gstCode: number): IndianState | undefined {
  return INDIAN_STATES.find((state) => state.gstStateCode === gstCode);
}

/**
 * Get all states
 */
export function getAllStates(): IndianState[] {
  return INDIAN_STATES.filter((state) => state.type === "state");
}

/**
 * Get all union territories
 */
export function getAllUnionTerritories(): IndianState[] {
  return INDIAN_STATES.filter((state) => state.type === "union_territory");
}

/**
 * Get all states and union territories
 */
export function getAllStatesAndUTs(): IndianState[] {
  return INDIAN_STATES;
}

/**
 * Check if state name is valid
 * @param stateName - State name to validate
 * @returns true if valid Indian state/UT, false otherwise
 */
export function isValidStateName(stateName: string): boolean {
  if (!stateName || typeof stateName !== "string") {
    return false;
  }
  return getStateByName(stateName) !== undefined;
}
