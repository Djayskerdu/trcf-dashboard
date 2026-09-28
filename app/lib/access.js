// Who can see / do what. Keep in sync with ROLES in apps-script/Code.gs
// (the server enforces this too — this file only decides what the UI shows).

export const ROLE_TABS = {
  leader: ['Homepage', 'Dashboard', 'Attendance', 'Regular Members', 'First Timers', 'Events', 'Leaders', 'Finance', 'FollowUp', 'QR Scan', 'Manage Data', 'Accounts'],
  admin: ['Homepage', 'Dashboard', 'Attendance', 'Regular Members', 'Events', 'Leaders', 'Finance', 'FollowUp', 'QR Scan', 'Manage Data'],
  consolidation: ['Homepage', 'Regular Members', 'First Timers', 'Attendance', 'Events', 'Leaders'],
  staff: ['Homepage', 'Regular Members', 'Attendance', 'Events', 'Leaders', 'Manage Data'],
}

export const ROLE_WRITE = {
  leader: { tables: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance'], ops: ['add', 'update', 'delete'] },
  admin: { tables: ['attendance', 'members', 'followup', 'events', 'leaders', 'finance'], ops: ['add', 'update', 'delete'] },
  staff: { tables: ['attendance'], ops: ['add'] },
  consolidation: { tables: [], ops: [] },
}
