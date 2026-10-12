export const PROJECT_FEATURES = [
  "Security Guard", "Swimming Pool", "CCTV/IP Camera", "Garden", "Elevator", "Gym",
  "24-hour Security", "Wi-Fi", "Covered Parking", "Pool Table", "Clubhouse", "Function Room",
  "Lobby in Building", "EV Charger", "Communal Kitchen", "Library", "Mail Box", "Shuttle Bus",
] as const;
export type ProjectFeature = typeof PROJECT_FEATURES[number];
export function validProjectFeatures(value: unknown): value is ProjectFeature[] {
  return Array.isArray(value) && value.length <= PROJECT_FEATURES.length &&
    value.every(item => typeof item === "string" && PROJECT_FEATURES.includes(item as ProjectFeature)) &&
    new Set(value).size === value.length;
}
export function readProjectFeatures(value: unknown): ProjectFeature[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return validProjectFeatures(parsed) ? PROJECT_FEATURES.filter(item => parsed.includes(item)) : [];
  } catch { return []; }
}
