/**
 * Bureaus for grouped totals. The leadership posts are one person each, so
 * they count as one group, sized like the other biros. A member keeps their
 * own Jawatan everywhere it describes them (member rows, order details);
 * only filters and bureau totals use the group.
 */
export const LEADERSHIP_GROUP = 'Pengurusan Tertinggi'

const LEADERSHIP_ROLES = new Set(['pengarah', 'timbalan pengarah', 'setiausaha', 'bendahari', 'timbalan bendahari'])

export const bureauOf = (role) => (LEADERSHIP_ROLES.has(String(role ?? '').trim().toLowerCase()) ? LEADERSHIP_GROUP : role)
