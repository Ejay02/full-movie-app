export const AVATAR_STORAGE_KEY = 'timi-stream-profile-avatars';
export const AVATARS = [
  { id: 'cinema-kid', label: 'Cinema kid', src: '/avatars/cinema-kid.jpg' },
  { id: 'hearts', label: 'All hearts', src: '/avatars/hearts.jpg' },
  { id: 'ninja', label: 'Ninja', src: '/avatars/ninja.png' },
  { id: 'blue-moon', label: 'Blue moon', src: '/avatars/blue-moon.jpg' },
  { id: 'king-julien', label: 'King Julien', src: '/avatars/king-julien.jpg' },
];
export const validProfile = (user) => ['Timi', 'Ejay'].includes(user);
export const avatarById = (id) => AVATARS.find(avatar => avatar.id === id);
export function readAvatars() {
  try {
    const raw = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY)) || {};
    return Object.fromEntries(Object.entries(raw).filter(([user, value]) => validProfile(user) && avatarById(value?.id) && Number.isFinite(value.updatedAt)));
  } catch (_) { return {}; }
}

export function mergeAvatar(profiles, user, avatar) {
  if (!validProfile(user) || !avatarById(avatar?.id) || !Number.isFinite(avatar.updatedAt)) return profiles;
  if (profiles[user]?.updatedAt > avatar.updatedAt) return profiles;
  return { ...profiles, [user]: { id: avatar.id, updatedAt: avatar.updatedAt } };
}
