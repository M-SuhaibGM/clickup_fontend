export const getInitials = (name?: string) => {
  if (!name) return 'W';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};
