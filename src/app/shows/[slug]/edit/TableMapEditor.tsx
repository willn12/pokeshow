'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Star, X, Loader2, Map } from 'lucide-react'
import { TIER_COLOR_MAP } from './TableTierManager'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Room {
  id: string; name: string; color: string; rows: number; cols: number
}

interface PlacedTable {
  roomId: string; row: number; col: number; label: string
  vendorId: string | null; isPremium: boolean
}

interface FloorPlan {
  rooms: Room[]; tables: PlacedTable[]
}

interface VendorInfo {
  id: string; displayName: string
  status: 'approved' | 'confirmed'
  tierColor: string | null; tierName: string | null
  approvedQty: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROOM_COLORS = ['gray', 'blue', 'green', 'amber', 'purple', 'rose']

const ROOM_BG: Record<string, string> = {
  gray:   'bg-gray-100',
  blue:   'bg-blue-50',
  green:  'bg-green-50',
  amber:  'bg-amber-50',
  purple: 'bg-purple-50',
  rose:   'bg-rose-50',
}

const ROOM_SWATCH: Record<string, string> = {
  gray:   'bg-gray-300',
  blue:   'bg-blue-300',
  green:  'bg-green-300',
  amber:  'bg-amber-300',
  purple: 'bg-purple-300',
  rose:   'bg-rose-300',
}

function rowLetter(r: number) { return String.fromCharCode(65 + r) }
function autoLabel(r: number, c: number) { return `${rowLetter(r)}${c + 1}` }

function blankRoom(idx: number): Room {
  return {
    id: `room-${Date.now()}-${idx}`,
    name: idx === 0 ? 'Main Hall' : `Room ${idx + 1}`,
    color: ROOM_COLORS[idx % ROOM_COLORS.length],
    rows: 5, cols: 8,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TableMapEditor({ slug }: { slug: string }) {
  const [plan, setPlan]               = useState<FloorPlan>({ rooms: [], tables: [] })
  const [vendors, setVendors]         = useState<VendorInfo[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [vendorSearch, setVendorSearch] = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/shows/${slug}`).then(r => r.json()),
      fetch(`/api/shows/${slug}/vendors`).then(r => r.json()),
    ]).then(([showData, vendorData]) => {
      const fp = showData.floorPlan as FloorPlan | null
      if (fp && Array.isArray(fp.rooms)) setPlan(fp)
      const approved: VendorInfo[] = (vendorData.vendors ?? [])
        .filter((v: { status: string }) => v.status === 'approved' || v.status === 'confirmed')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((v: any) => ({
          id:          v.id,
          displayName: v.user.businessName || v.user.name,
          status:      v.status,
          tierColor:   v.tableTier?.color ?? null,
          tierName:    v.tableTier?.name  ?? null,
          approvedQty: v.approvedQuantity ?? v.requestedQuantity,
        }))
      setVendors(approved)
    }).finally(() => setLoading(false))
  }, [slug])

  // Keep a room selected whenever rooms exist
  useEffect(() => {
    if (!selectedRoom && plan.rooms.length > 0) setSelectedRoom(plan.rooms[0].id)
  }, [plan.rooms, selectedRoom])

  const currentRoom = plan.rooms.find(r => r.id === selectedRoom) ?? null

  function tableAt(row: number, col: number): PlacedTable | null {
    if (!currentRoom) return null
    return plan.tables.find(t => t.roomId === currentRoom.id && t.row === row && t.col === col) ?? null
  }

  function assignedCount(vendorId: string) {
    return plan.tables.filter(t => t.vendorId === vendorId).length
  }

  function selectCell(row: number, col: number) {
    const already = selectedCell?.row === row && selectedCell?.col === col
    setSelectedCell(already ? null : { row, col })
    setVendorSearch('')
  }

  function assignVendor(vendorId: string) {
    if (!currentRoom || !selectedCell) return
    const { row, col } = selectedCell
    setPlan(p => {
      const existing = p.tables.find(t => t.roomId === currentRoom.id && t.row === row && t.col === col)
      const filtered = p.tables.filter(t => !(t.roomId === currentRoom.id && t.row === row && t.col === col))
      return {
        ...p,
        tables: [...filtered, {
          roomId: currentRoom.id, row, col,
          label: existing?.label ?? autoLabel(row, col),
          vendorId,
          isPremium: existing?.isPremium ?? false,
        }],
      }
    })
    setSelectedCell(null)
    setVendorSearch('')
  }

  function clearCell() {
    if (!currentRoom || !selectedCell) return
    const { row, col } = selectedCell
    setPlan(p => ({ ...p, tables: p.tables.filter(t => !(t.roomId === currentRoom.id && t.row === row && t.col === col)) }))
    setSelectedCell(null)
  }

  function togglePremium() {
    if (!currentRoom || !selectedCell) return
    const { row, col } = selectedCell
    setPlan(p => ({
      ...p,
      tables: p.tables.map(t =>
        t.roomId === currentRoom.id && t.row === row && t.col === col ? { ...t, isPremium: !t.isPremium } : t
      ),
    }))
  }

  function addRoom() {
    const room = blankRoom(plan.rooms.length)
    setPlan(p => ({ ...p, rooms: [...p.rooms, room] }))
    setSelectedRoom(room.id)
    setSelectedCell(null)
  }

  function removeRoom(roomId: string) {
    const remaining = plan.rooms.filter(r => r.id !== roomId)
    setPlan(p => ({
      rooms: remaining,
      tables: p.tables.filter(t => t.roomId !== roomId),
    }))
    setSelectedRoom(remaining[0]?.id ?? null)
    setSelectedCell(null)
  }

  function updateRoom(roomId: string, patch: Partial<Room>) {
    setPlan(p => {
      const updatedRooms = p.rooms.map(r => r.id === roomId ? { ...r, ...patch } : r)
      const updated = updatedRooms.find(r => r.id === roomId)!
      const tables = (patch.rows !== undefined || patch.cols !== undefined)
        ? p.tables.filter(t => t.roomId !== roomId || (t.row < updated.rows && t.col < updated.cols))
        : p.tables
      return { rooms: updatedRooms, tables }
    })
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/shows/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorPlan: plan }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const selectedTable  = selectedCell && currentRoom ? tableAt(selectedCell.row, selectedCell.col) : null
  const selectedVendor = selectedTable?.vendorId ? vendors.find(v => v.id === selectedTable.vendorId) ?? null : null
  const filteredVendors = vendors.filter(v => v.displayName.toLowerCase().includes(vendorSearch.toLowerCase()))

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-ps-muted" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r border-ps-borderLight flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-ps-borderLight">
          <p className="text-[10px] font-bold text-ps-muted uppercase tracking-widest">Rooms</p>
        </div>

        <div className="flex-1 py-2">
          {plan.rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => { setSelectedRoom(room.id); setSelectedCell(null) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                selectedRoom === room.id
                  ? 'bg-ps-accentLight text-ps-accent font-semibold'
                  : 'text-ps-secondary hover:bg-gray-50 hover:text-ps-text font-medium'
              }`}
            >
              <span className={`w-3 h-3 rounded-sm shrink-0 ${ROOM_SWATCH[room.color] ?? ROOM_SWATCH.gray}`} />
              <span className="text-sm truncate">{room.name}</span>
            </button>
          ))}
          <button
            onClick={addRoom}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ps-muted hover:text-ps-accent hover:bg-gray-50 transition-colors"
          >
            <Plus size={13} /> Add room
          </button>
        </div>

        {/* Room settings */}
        {currentRoom && (
          <div className="border-t border-ps-borderLight px-4 py-4 space-y-3">
            <p className="text-[10px] font-bold text-ps-muted uppercase tracking-widest">Room settings</p>

            <div>
              <label className="text-xs text-ps-muted block mb-1">Name</label>
              <input
                value={currentRoom.name}
                onChange={e => updateRoom(currentRoom.id, { name: e.target.value })}
                className="w-full text-xs border border-ps-border rounded-lg px-2.5 py-1.5 text-ps-text focus:outline-none focus:border-ps-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-ps-muted block mb-1">Rows</label>
                <input
                  type="number" min={1} max={20}
                  value={currentRoom.rows}
                  onChange={e => updateRoom(currentRoom.id, { rows: Math.max(1, Math.min(20, Number(e.target.value))) })}
                  className="w-full text-xs border border-ps-border rounded-lg px-2 py-1.5 text-ps-text focus:outline-none focus:border-ps-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-ps-muted block mb-1">Cols</label>
                <input
                  type="number" min={1} max={26}
                  value={currentRoom.cols}
                  onChange={e => updateRoom(currentRoom.id, { cols: Math.max(1, Math.min(26, Number(e.target.value))) })}
                  className="w-full text-xs border border-ps-border rounded-lg px-2 py-1.5 text-ps-text focus:outline-none focus:border-ps-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-ps-muted block mb-1.5">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateRoom(currentRoom.id, { color })}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${ROOM_SWATCH[color]} ${
                      currentRoom.color === color ? 'border-ps-accent scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {plan.rooms.length > 1 && (
              <button
                onClick={() => removeRoom(currentRoom.id)}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                <Trash2 size={11} /> Remove room
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Grid area */}
        <div className="flex-1 overflow-auto">

          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-white border-b border-ps-borderLight px-5 py-2.5 flex items-center gap-3">
            <span className="text-xs text-ps-muted">
              {plan.tables.filter(t => t.vendorId).length} vendors placed
              {currentRoom && ` · ${currentRoom.rows * currentRoom.cols} tables in ${currentRoom.name}`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {saved && (
                <span className="text-xs font-medium text-green-600">Saved!</span>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 bg-ps-accent hover:bg-ps-accentHover disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save Map'}
              </button>
            </div>
          </div>

          {/* Empty state */}
          {plan.rooms.length === 0 ? (
            <div className="h-[calc(100%-44px)] flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-ps-accentLight flex items-center justify-center">
                <Map size={28} className="text-ps-accent" />
              </div>
              <div>
                <p className="font-semibold text-ps-text text-base">No rooms yet</p>
                <p className="text-sm text-ps-muted mt-1">Add a room to start placing tables and assigning vendors.</p>
              </div>
              <button
                onClick={addRoom}
                className="flex items-center gap-2 bg-ps-accent hover:bg-ps-accentHover text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus size={14} /> Add first room
              </button>
            </div>
          ) : currentRoom ? (
            <div className="p-6">
              <div className={`inline-block rounded-2xl p-5 ${ROOM_BG[currentRoom.color] ?? ROOM_BG.gray}`}>

                <p className="text-xs font-bold text-ps-muted uppercase tracking-wider mb-4">{currentRoom.name}</p>

                {/* Column headers */}
                <div className="flex gap-2 mb-1.5 ml-8">
                  {Array.from({ length: currentRoom.cols }, (_, c) => (
                    <div key={c} className="w-[88px] text-center text-[10px] font-semibold text-ps-muted">{c + 1}</div>
                  ))}
                </div>

                {/* Rows */}
                {Array.from({ length: currentRoom.rows }, (_, r) => (
                  <div key={r} className="flex gap-2 mb-2 items-center">
                    <div className="w-6 text-center text-[10px] font-bold text-ps-muted shrink-0">{rowLetter(r)}</div>
                    {Array.from({ length: currentRoom.cols }, (_, c) => {
                      const table    = tableAt(r, c)
                      const vendor   = table?.vendorId ? vendors.find(v => v.id === table.vendorId) : null
                      const tc       = vendor?.tierColor ? (TIER_COLOR_MAP[vendor.tierColor] ?? TIER_COLOR_MAP.gray) : null
                      const isSelected = selectedCell?.row === r && selectedCell?.col === c
                      const isPremium  = table?.isPremium ?? false

                      return (
                        <button
                          key={c}
                          onClick={() => selectCell(r, c)}
                          className={`w-[88px] h-14 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all px-1.5 text-center ${
                            isSelected ? 'ring-2 ring-offset-1 ring-ps-accent' : ''
                          } ${
                            isPremium ? '!border-amber-400 ring-1 ring-amber-300' : ''
                          } ${
                            table
                              ? tc
                                ? `${tc.bg} ${tc.border}`
                                : 'bg-gray-100 border-gray-300'
                              : 'bg-white border-dashed border-gray-300 hover:border-ps-accent hover:bg-ps-accentLight/40'
                          }`}
                        >
                          {isPremium && (
                            <Star size={9} className="absolute top-1 right-1.5 text-amber-500 fill-amber-400" />
                          )}
                          {vendor ? (
                            <>
                              <span className={`text-[10px] font-bold leading-tight truncate w-full text-center ${tc?.text ?? 'text-gray-700'}`}>
                                {vendor.displayName}
                              </span>
                              <span className="text-[9px] text-ps-muted mt-0.5">{table?.label ?? autoLabel(r, c)}</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-medium">{autoLabel(r, c)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              {(() => {
                const roomVendors = vendors.filter(v => plan.tables.some(t => t.roomId === currentRoom.id && t.vendorId === v.id))
                if (roomVendors.length === 0) return null
                return (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-ps-muted uppercase tracking-wider mb-3">Vendors in this room</p>
                    <div className="flex flex-wrap gap-2">
                      {roomVendors.map(v => {
                        const tc      = v.tierColor ? (TIER_COLOR_MAP[v.tierColor] ?? TIER_COLOR_MAP.gray) : null
                        const count   = plan.tables.filter(t => t.roomId === currentRoom.id && t.vendorId === v.id).length
                        const premium = plan.tables.some(t => t.roomId === currentRoom.id && t.vendorId === v.id && t.isPremium)
                        return (
                          <span key={v.id} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${tc ? `${tc.bg} ${tc.border} ${tc.text}` : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                            {premium && <Star size={9} className="text-amber-500 fill-amber-400" />}
                            {v.displayName}
                            {count > 1 && <span className="opacity-60 font-normal">×{count}</span>}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : null}
        </div>

        {/* ── CELL DETAIL PANEL ──────────────────────────────────────────────── */}
        {selectedCell && currentRoom && (
          <div className="w-64 shrink-0 border-l border-ps-borderLight bg-white flex flex-col overflow-hidden">

            {/* Panel header */}
            <div className="px-4 py-3 border-b border-ps-borderLight flex items-center justify-between shrink-0">
              <p className="font-semibold text-ps-text text-sm">
                Table {selectedTable?.label ?? autoLabel(selectedCell.row, selectedCell.col)}
              </p>
              <button onClick={() => setSelectedCell(null)} className="text-ps-muted hover:text-ps-text transition-colors">
                <X size={15} />
              </button>
            </div>

            {selectedTable && selectedVendor ? (
              /* ── Occupied ─────────────────────────────────────────────────── */
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Vendor card */}
                <div className="px-4 py-4 border-b border-ps-borderLight shrink-0">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-ps-accentLight text-ps-accent font-bold text-xs flex items-center justify-center shrink-0">
                      {selectedVendor.displayName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ps-text text-sm leading-tight">{selectedVendor.displayName}</p>
                      <p className={`text-xs mt-0.5 font-medium ${selectedVendor.status === 'confirmed' ? 'text-purple-600' : 'text-green-600'}`}>
                        {selectedVendor.status === 'confirmed' ? 'Confirmed' : 'Approved'}
                      </p>
                    </div>
                  </div>

                  {selectedVendor.tierName && (() => {
                    const tc = selectedVendor.tierColor ? (TIER_COLOR_MAP[selectedVendor.tierColor] ?? TIER_COLOR_MAP.gray) : TIER_COLOR_MAP.gray
                    return (
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${tc.bg} ${tc.border} ${tc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                          {selectedVendor.tierName}
                        </span>
                      </div>
                    )
                  })()}

                  <p className="text-xs text-ps-muted mt-2">
                    {assignedCount(selectedVendor.id)} table{assignedCount(selectedVendor.id) !== 1 ? 's' : ''} placed
                    {selectedVendor.approvedQty > 1 && <span> / {selectedVendor.approvedQty} approved</span>}
                  </p>
                </div>

                {/* Premium toggle */}
                <div className="px-4 py-3 border-b border-ps-borderLight shrink-0">
                  <button
                    onClick={togglePremium}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
                      selectedTable.isPremium
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-ps-borderLight text-ps-secondary hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700'
                    }`}
                  >
                    <Star size={14} className={selectedTable.isPremium ? 'fill-amber-400 text-amber-500' : ''} />
                    {selectedTable.isPremium ? 'Premium spot' : 'Mark as premium'}
                  </button>
                </div>

                {/* Remove */}
                <div className="px-4 py-2.5 border-b border-ps-borderLight shrink-0">
                  <button
                    onClick={clearCell}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove vendor from table
                  </button>
                </div>

                {/* Reassign */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <p className="px-4 py-2 text-[10px] font-bold text-ps-muted uppercase tracking-widest border-b border-ps-borderLight shrink-0">
                    Reassign to
                  </p>
                  <div className="px-3 py-2 shrink-0">
                    <input
                      value={vendorSearch}
                      onChange={e => setVendorSearch(e.target.value)}
                      placeholder="Search vendors…"
                      className="w-full text-xs border border-ps-border rounded-lg px-2.5 py-1.5 text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent transition-colors"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                    {filteredVendors.filter(v => v.id !== selectedVendor.id).map(v => (
                      <button
                        key={v.id}
                        onClick={() => assignVendor(v.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-md bg-ps-accentLight text-ps-accent font-bold text-[10px] flex items-center justify-center shrink-0">
                          {v.displayName[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ps-text truncate">{v.displayName}</p>
                          <p className="text-[10px] text-ps-muted">{assignedCount(v.id)} placed</p>
                        </div>
                      </button>
                    ))}
                    {filteredVendors.filter(v => v.id !== selectedVendor.id).length === 0 && (
                      <p className="text-xs text-ps-muted text-center py-4">No other vendors.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Empty cell — vendor picker ────────────────────────────────── */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2.5 border-b border-ps-borderLight shrink-0">
                  <input
                    value={vendorSearch}
                    onChange={e => setVendorSearch(e.target.value)}
                    placeholder="Search vendors…"
                    autoFocus
                    className="w-full text-xs border border-ps-border rounded-lg px-2.5 py-1.5 text-ps-text placeholder:text-ps-muted focus:outline-none focus:border-ps-accent transition-colors"
                  />
                </div>

                {vendors.length === 0 ? (
                  <p className="px-4 py-8 text-xs text-ps-muted text-center">
                    No approved or confirmed vendors yet.
                  </p>
                ) : filteredVendors.length === 0 ? (
                  <p className="px-4 py-8 text-xs text-ps-muted text-center">No matches.</p>
                ) : (
                  <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                    {filteredVendors.map(v => {
                      const placed       = assignedCount(v.id)
                      const overAllocated = placed >= v.approvedQty
                      return (
                        <button
                          key={v.id}
                          onClick={() => assignVendor(v.id)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-ps-accentLight text-ps-accent font-bold text-xs flex items-center justify-center shrink-0">
                            {v.displayName[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-ps-text truncate">{v.displayName}</p>
                            <p className={`text-[10px] ${overAllocated ? 'text-amber-600 font-medium' : 'text-ps-muted'}`}>
                              {placed}/{v.approvedQty} tables{overAllocated ? ' · over limit' : ''}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold shrink-0 ${v.status === 'confirmed' ? 'text-purple-600' : 'text-green-600'}`}>
                            {v.status === 'confirmed' ? 'Paid' : 'Approved'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
