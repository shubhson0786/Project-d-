export const PROFILE_KEY = "stashflowUser";

export const defaultProfile = {
  name: "Stashflow User",
  email: "",
  phone: "",
  city: "",
  occupation: "",
  bio: "",
};

export function loadProfile() {
  try {
    return { ...defaultProfile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("stashflow:profile", { detail: profile }));
}

export function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SU";
}
