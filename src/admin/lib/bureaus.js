/**
 * Bureaus for grouped totals. Single posts are folded into a group, sized
 * like the other biros: MT (Majlis Tertinggi) for the leadership, Pengurusan
 * Kolej for the college fellows. A member keeps their own Jawatan everywhere
 * it describes them (member rows, order details); only filters and bureau
 * totals use the group.
 */
const GROUPS = [
  { name: 'MT', roles: ['pengarah', 'timbalan pengarah', 'setiausaha', 'bendahari', 'timbalan bendahari'] },
  { name: 'Pengurusan Kolej', roles: ['ymf pengetua', 'felo', 'felo (bendahari kolej)', 'felo (setiausaha kolej)', 'pembantu felo'] },
]

const GROUP_OF = new Map(GROUPS.flatMap((g) => g.roles.map((r) => [r, g.name])))

export const bureauOf = (role) => GROUP_OF.get(String(role ?? '').trim().replace(/\s+/g, ' ').toLowerCase()) ?? role
