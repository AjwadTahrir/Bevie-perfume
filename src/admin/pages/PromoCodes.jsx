import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Ticket } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, PageHeader, SearchInput, Select, TableScroll, TableSkeleton, Toolbar } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchMembers } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, n, rm } from '../lib/format'

export default function PromoCodes() {
  const toast = useToast()
  const { refresh } = useLiveData()
  const members = useQuery(() => fetchMembers(), [])
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [copied, setCopied] = useState('')
  const [toggle, setToggle] = useState(null)

  const all = members.data || []
  const inactive = all.filter((m) => !m.is_active).length
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all
      .filter((m) => !term || m.full_name.toLowerCase().includes(term) || m.promo_code.toLowerCase().includes(term) || m.committee_role.toLowerCase().includes(term))
      .filter((m) => !state || (state === 'active' ? m.is_active : !m.is_active))
      .sort((a, b) => a.member_no - b.member_no)
  }, [all, q, state])

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      toast('Could not copy. Select the code and copy it manually.', 'bad')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Committee"
        title="Promo Codes"
        description="One unique code per code holder. A valid code gives the customer the promo price and credits the sale to its owner."
      />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Name, code or bureau" label="Search promo codes" />
        <Select
          label="Code status"
          value={state}
          onChange={setState}
          className="w-full sm:w-44"
          options={[
            { value: '', label: 'All codes' },
            { value: 'active', label: 'Active only' },
            { value: 'inactive', label: 'Inactive only' },
          ]}
        />
        {members.data && (
          <p className="text-xs text-ink-3 sm:ml-auto">
            {n(all.length - inactive)} active · {n(inactive)} inactive
          </p>
        )}
      </Toolbar>
      {members.error && !members.data && <ErrorState error={members.error} />}
      <Card bodyClass="p-0">
        {members.loading && !members.data ? (
          <TableSkeleton rows={10} cols={5} />
        ) : !rows.length ? (
          <EmptyState icon={Ticket} title="No codes match your search" />
        ) : (
          <TableScroll label="Promo codes">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="th hidden w-14 xl:table-cell">No.</th>
                  <th className="th">Code</th>
                  <th className="th">Owner</th>
                  <th className="th text-right">Orders</th>
                  <th className="th text-right">Bottles</th>
                  <th className="th text-right">Revenue</th>
                  <th className="th">Status</th>
                  <th className="th">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((m) => (
                  <tr key={m.member_id} className={`transition-colors duration-150 hover:bg-tint/50 ${m.is_active ? '' : 'bg-tint/40'}`}>
                    <td className="td hidden text-ink-3 tabular-nums xl:table-cell">{m.member_no}</td>
                    <td className="td">
                      <button
                        type="button"
                        onClick={() => copy(m.promo_code)}
                        className={`inline-flex items-center gap-2 rounded-md bg-surface px-2.5 py-1 font-mono text-sm font-medium tracking-wider ring-1 ring-line-strong transition-colors hover:ring-ink-3/60 ${m.is_active ? '' : 'text-ink-3 line-through decoration-ink-3/60'}`}
                        aria-label={`Copy code ${m.promo_code}`}
                      >
                        {m.promo_code}
                        {copied === m.promo_code ? <Check size={13} className="text-good" /> : <Copy size={13} className="text-ink-3" />}
                      </button>
                    </td>
                    <td className="td">
                      <Link to={`/members/${m.member_id}`} className={`block font-medium hover:text-brand-deep hover:underline ${m.is_active ? '' : 'text-ink-2'}`}>
                        {displayName(m.full_name)}
                      </Link>
                      <span className="text-xs text-ink-3">{m.committee_role}</span>
                    </td>
                    <td className="td text-right tabular-nums">{n(m.total_orders)}</td>
                    <td className="td text-right tabular-nums">{n(m.verified_bottles)}</td>
                    <td className="td text-right tabular-nums">{rm(m.revenue)}</td>
                    <td className="td">{m.is_active ? <Badge tone="good">Active</Badge> : <Badge tone="bad">Inactive</Badge>}</td>
                    <td className="td text-right">
                      <button type="button" className={`btn h-8 px-2.5 text-xs ${m.is_active ? 'btn-ghost text-bad hover:bg-bad-soft hover:text-bad' : 'btn-secondary'}`} onClick={() => setToggle(m)}>
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>
      <ConfirmDialog
        open={!!toggle}
        title={toggle?.is_active ? `Deactivate ${toggle?.promo_code}?` : `Activate ${toggle?.promo_code}?`}
        body={
          toggle?.is_active
            ? 'New customers will no longer get the promo price with this code. Existing orders and their attribution stay unchanged.'
            : 'Customers will be able to use this code again.'
        }
        confirmLabel={toggle?.is_active ? 'Deactivate' : 'Activate'}
        tone={toggle?.is_active ? 'danger' : 'primary'}
        onConfirm={async () => {
          await actions.setMemberActive(toggle.member_id, !toggle.is_active)
          toast(`Code ${toggle.promo_code} ${toggle.is_active ? 'deactivated' : 'activated'}.`)
          refresh()
        }}
        onClose={() => setToggle(null)}
      />
    </>
  )
}
