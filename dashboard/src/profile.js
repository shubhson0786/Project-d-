export const PROFILE_KEY = "stashflowUser";
export const defaultProfile = { id: "", name: "Stashflow User", email: "", phone: "", city: "", occupation: "", bio: "" };
// Server-loaded identity in memory. Profile data is persisted through /api/profile.
let currentProfile = { ...defaultProfile };
export function loadProfile() { return { ...currentProfile }; }
export function saveProfile(profile) {
  currentProfile = { ...defaultProfile, ...profile };
  window.dispatchEvent(new CustomEvent("stashflow:profile", { detail: loadProfile() }));
}
export function clearProfile() {
  currentProfile = { ...defaultProfile };
  localStorage.removeItem(PROFILE_KEY);
}
export function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "SU";
}
