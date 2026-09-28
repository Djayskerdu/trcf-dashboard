// Who can see / do what. Keep in sync with ROLES in apps-script/Code.gs
// (the server enforces this too — this file only decides what the UI shows).

export const ROLE_TABS = {
  leader: ['Homepage', 'Dashboard', 'Attendance', 'Regular Members', 'First Timers', 'Consolidation', 'Events', 'Leaders', 'Finance', 'FollowUp', 'QR Scan', 'Manage Data', 'Accounts'],
  admin: ['Homepage', 'Dashboard', 'Attendance', 'Regular Members', 'Consolidation', 'Events', 'Leaders', 'Finance', 'FollowUp', 'QR Scan', 'Manage Data'],
  conso_head: ['Homepage', 'Regular Members', 'First Timers', 'Consolidation', 'Attendance', 'Events', 'Leaders'],
  conso_staff: ['Homepage', 'Regular Members', 'First Timers', 'Consolidation', 'Attendance', 'Events', 'Leaders'],
  staff: ['Homepage', 'Regular Members', 'Attendance', 'Events', 'Leaders', 'Manage Data'],
}
// Accounts created before the split keep working as Conso Staff.
ROLE_TABS.consolidation = ROLE_TABS.conso_staff

export const ROLE_WRITE = {
  leader: { tables: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'consolidation'], ops: ['add', 'update', 'delete'] },
  admin: { tables: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance', 'consolidation'], ops: ['add', 'update', 'delete'] },
  staff: { tables: ['attendance'], ops: ['add'] },
  conso_head: { tables: ['consolidation'], ops: ['add', 'update', 'delete'] },
  conso_staff: { tables: ['consolidation'], ops: ['add', 'update'] },
}
ROLE_WRITE.consolidation = ROLE_WRITE.conso_staff

/** Roles that can see the follow-up board, change status/notes, reassign and delete. */
export const CONSO_MANAGERS = ['leader', 'admin', 'conso_head']

export const ROLE_LABEL = {
  leader: 'Leader',
  admin: 'Admin',
  staff: 'Staff',
  conso_head: 'Conso Head',
  conso_staff: 'Conso Staff',
  consolidation: 'Conso Staff',
}
