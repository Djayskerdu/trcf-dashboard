'use client'

import { Html5QrcodeScanner } from 'html5-qrcode'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import {
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react'

import {
  Home,
  Calendar,
  Users,
  ClipboardList,
  Search,
  Menu,
  Shield,
  QrCode,
  LayoutDashboard,
  HandCoins,
  UserRoundCheck,
  Database,
  LogOut,
  KeyRound,
  ClipboardCheck,
  UserPlus,
  HeartHandshake,
} from 'lucide-react'

import LoginScreen from './components/LoginScreen'
import ManageData from './components/ManageData'
import RegularMembers from './components/RegularMembers'
import FirstTimers from './components/FirstTimers'
import Consolidation from './components/Consolidation'
import AccountsPanel from './components/AccountsPanel'
import ChangePassword from './components/ChangePassword'
import { api, loadSession, saveSession, clearSession } from './lib/api'
import { ROLE_TABS, ROLE_LABEL } from './lib/access'

import CalendarView from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

const ALL_TABS = [
  { name: 'Homepage', icon: <Home size={18} /> },
  { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { name: 'Attendance', icon: <ClipboardList size={18} /> },
  { name: 'Regular Members', icon: <ClipboardCheck size={18} /> },
  { name: 'First Timers', icon: <UserPlus size={18} /> },
  { name: 'Consolidation', icon: <HeartHandshake size={18} /> },
  { name: 'Events', icon: <Calendar size={18} /> },
  { name: 'Leaders', icon: <Users size={18} /> },
  { name: 'Finance', icon: <HandCoins size={18} /> },
  { name: 'FollowUp', icon: <UserRoundCheck size={18} /> },
  { name: 'QR Scan', icon: <QrCode size={18} /> },
  { name: 'Manage Data', icon: <Database size={18} /> },
  { name: 'Accounts', icon: <Shield size={18} /> },
]

const TAB_SUBTITLE = {
  Homepage: 'Welcome back — let’s keep the Jam going',
  Dashboard: 'How the youth are showing up',
  Attendance: 'Who came and when',
  'Regular Members': 'Tick who’s here today — spot who needs a follow-up',
  'First Timers': 'Type in today’s first timers',
  Consolidation: 'Assign first timers to a leader and track the follow-up',
  Events: 'What’s coming up and what’s passed',
  Leaders: 'Your leaders and the people they’re discipling',
  Finance: 'Giving records',
  FollowUp: 'First timers waiting for a friendly hello',
  'QR Scan': 'Scan a pass to mark attendance',
  'Manage Data': 'Add, edit and clean up records',
  Accounts: 'Logins, notifications and activity history',
}

const getDeviceInfo = () => {

  const ua = navigator.userAgent

  let browser = 'Unknown'

  if (ua.includes('Chrome')) {
    browser = 'Chrome'
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('Safari')) {
    browser = 'Safari'
  }

  let device = 'Desktop'

  if (/Android/i.test(ua)) {
    device = 'Android'
  }

  if (/iPhone|iPad|iPod/i.test(ua)) {
    device = 'iPhone'
  }

  return {
    browser,
    device,
  }
}

function Dashboard({ session, onLogout, onSessionUpdate }) {
  const role = session.user.role
  const isLeader = role === 'leader'
  const isAdmin = role === 'admin'
  const [showPassword, setShowPassword] = useState(false)
  const [refs, setRefs] = useState({})

const handleSendFirstTimersBulk = async () => {

  try {

    const data = await api('sendWelcomeQR', { date: startDate })

    alert(
      `✅ Welcome QR sent to ${data.total} people` +
      (data.failed ? ` (${data.failed} failed)` : '')
    )

  } catch (err) {

    console.error(err)

    alert(
      "❌ " + err.message
    )
  }
}

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [installPrompt, setInstallPrompt] =
  useState(null)

  const [attendance, setAttendance] = useState([])
  const [events, setEvents] = useState([])
  const [leaders, setLeaders] = useState([])
  const [consolidation, setConsolidation] = useState([])
  const [followup, setFollowup] = useState([])
  const [finance, setFinance] = useState([])
  const [members, setMembers] = useState([]) // ← ADD HERE
  const [qrMemberId, setQrMemberId] =
  useState('')
  const [generatedQR, setGeneratedQR] =
  useState('')
  const [youthGetLoud, setYouthGetLoud] = useState([])
  const [yglParticipants, setYglParticipants] =
  useState([])
const [isStandalone, setIsStandalone] =
  useState(false)

const [selectedEventParticipants,
  setSelectedEventParticipants] =
  useState(null)

  const [activeTab, setActiveTab] = useState('Homepage')

  const [selectedLeader, setSelectedLeader] =
    useState(null)

    const [expandedClosecell, setExpandedClosecell] =
  useState(null)

  const [search, setSearch] = useState('')
  const [attPage, setAttPage] = useState(1)
  const [attPageSize, setAttPageSize] = useState(25)
  const [printAll, setPrintAll] = useState(false)
  

  const goPrevMonth = () => {
  setCalendarDate((prev) => {
    const d = new Date(prev)
    d.setMonth(d.getMonth() - 1)
    return d
  })
}

const goNextMonth = () => {
  setCalendarDate((prev) => {
    const d = new Date(prev)
    d.setMonth(d.getMonth() + 1)
    return d
  })
}

const goToday = () => {
  setCalendarDate(new Date())
}

const [selectedHoliday, setSelectedHoliday] =
  useState(null)

const philippineHolidays = [
  {
    date: '2026-01-01',
    title: 'New Year’s Day',
    description:
      'Regular Holiday in the Philippines',
  },
  {
    date: '2026-04-02',
    title: 'Maundy Thursday',
    description:
      'Holy Week Holiday',
  },
  {
    date: '2026-04-03',
    title: 'Good Friday',
    description:
      'Holy Week Holiday',
  },
  {
    date: '2026-04-09',
    title: 'Araw ng Kagitingan',
    description:
      'Day of Valor',
  },
  {
    date: '2026-05-01',
    title: 'Labor Day',
    description:
      'National Labor Holiday',
  },
  {
    date: '2026-06-12',
    title: 'Independence Day',
    description:
      'Philippine Independence Day',
  },
  {
    date: '2026-08-31',
    title: 'National Heroes Day',
    description:
      'Last Monday of August',
  },
  {
    date: '2026-11-30',
    title: 'Bonifacio Day',
    description:
      'Birth Anniversary of Andres Bonifacio',
  },
  {
    date: '2026-12-25',
    title: 'Christmas Day',
    description:
      'Regular Holiday',
  },
  {
    date: '2026-12-30',
    title: 'Rizal Day',
    description:
      'Commemoration of Jose Rizal',
  },
]

const selectedMember =
  members
    .slice(1)
    .find(
      m =>
        String(m[0]).trim() ===
        String(qrMemberId).trim()
    )

const [isMobile, setIsMobile] = useState(false)

useEffect(() => {

  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768)
  }

  checkMobile()

  window.addEventListener('resize', checkMobile)

  return () =>
    window.removeEventListener(
      'resize',
      checkMobile
    )

}, [])

useEffect(() => {

  if (typeof window === 'undefined') return

  const standalone =
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches ||
    window.navigator.standalone === true

  setIsStandalone(standalone)

}, [])

  const [selectedCalendarDate, setSelectedCalendarDate] =
  useState(new Date())

const [selectedCalendarEvent, setSelectedCalendarEvent] =
  useState(null)

const isDetailsOnly =
  selectedCalendarEvent?.eventType === "DETAILS_ONLY"

const today = new Date()

const [calendarMonth, setCalendarMonth] =
  useState(today.getMonth())

const [calendarYear, setCalendarYear] =
  useState(today.getFullYear())

const [calendarDate, setCalendarDate] = useState(new Date())

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
const [history, setHistory] = useState([])
const [scanResult, setScanResult] =
  useState(null)

  const [scannerInstance, setScannerInstance] =
  useState(null)

const [scannerError, setScannerError] =
  useState('')

  const lastScanRef = useRef(0)

  useEffect(() => {

  if (activeTab !== 'QR Scan') return

  const isInstalled =
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches

  if (!isInstalled) return

  // =========================
  // CLEAR OLD HTML
  // =========================

  const reader =
    document.getElementById('reader')

  if (reader) {
    reader.innerHTML = ''
  }

  const scanner =
    new Html5QrcodeScanner(
      'reader',
      {
        fps: 5,
        qrbox: 260,
      },
      false
    )

  setScannerInstance(scanner)

  let isScanning = false

  scanner.render(

    async (decodedText) => {

      if (isScanning) return

      isScanning = true

      let memberId = decodedText

      // =========================
      // QR FORMAT
      // =========================

      if (
        decodedText.startsWith(
          'TRCF_MEMBER:'
        )
      ) {

        memberId =
          decodedText.replace(
            'TRCF_MEMBER:',
            ''
          )
      }

      memberId =
        memberId
          .toString()
          .trim()

      const cleanMemberId =
        memberId
          .replace(/\s/g, '')
          .toLowerCase()

      const foundMember =
        members
          .slice(1)
          .find((m) => {

            const sheetId =
              String(m[0] || '')
                .trim()
                .replace(/\s/g, '')
                .toLowerCase()

            return (
              sheetId === cleanMemberId
            )

          })

      // =========================
      // MEMBER FOUND
      // =========================

      if (foundMember) {

        try {

          // STOP CAMERA
          await scanner.clear()

          // SAVE ATTENDANCE
          await api('scan', { id: memberId })

        } catch (err) {
          console.log(err)
        }

        // SHOW RESULT
        setScanResult({

          MemberID: foundMember[0],

          FullName: foundMember[1],

          Age: foundMember[2],

          Gender: foundMember[3],

          Contact: foundMember[4],

          Email: foundMember[5],

          LGLeader: foundMember[6],

        })

        setScannerError('')

      } else {

        setScanResult(null)

        setScannerError(
          `Member not found: ${memberId}`
        )

      }

      setTimeout(() => {
        isScanning = false
      }, 2500)

    },

    () => {}

  )

  return () => {

    scanner.clear().catch(() => {})

  }

}, [activeTab, members])



  /* ================= FETCH ================= */

  useEffect(() => {
    fetchData()
  }, [])

useEffect(() => {

  // attach this device's push subscription to the logged-in account
  if (typeof window === 'undefined') return

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  if (!standalone) return

  let tries = 0

  const timer = setInterval(async () => {

    tries++

    const sub = window.OneSignal?.User?.PushSubscription

    if (sub?.id && sub.optedIn) {

      clearInterval(timer)

      const { device, browser } = getDeviceInfo()

      try {
        await api('saveDevice', {
          onesignalId: sub.id,
          device,
          browser,
        })
      } catch (err) {
        console.log(err)
      }

    } else if (tries > 20) {
      clearInterval(timer)
    }

  }, 1500)

  return () => clearInterval(timer)

}, [])

useEffect(() => {

  const handler = (e) => {

    e.preventDefault()

    setInstallPrompt(e)
  }

  window.addEventListener(
    'beforeinstallprompt',
    handler
  )

  return () => {

    window.removeEventListener(
      'beforeinstallprompt',
      handler
    )
  }

}, [])

  const fetchData = async () => {

    try {

      const res = await api('getData')

      setRefs(res.refs || {})

      setAttendance(res.attendance || [])
setEvents(res.events || [])
setLeaders(res.leaders || [])
setConsolidation(res.consolidation || [])
setFollowup(res.followup || [])
setFinance(res.finance || [])
setHistory(
  res.history || []
)
setMembers(res.members || [])
      setYouthGetLoud(
  res.youthgetloud || []
)
      setYglParticipants(res.youthgetloud || [])

    } catch (err) {

      console.log(err)

    }
  }

  /* ================= FORMAT DATE ================= */

  const formatDate = (date) => {

    if (!date) return ''

    const d = new Date(date)

    if (isNaN(d)) return ''

    const year = d.getFullYear()
    const month = String(
      d.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      d.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  /* ================= DISPLAY DATE ================= */

  const displayDate = (date) => {

    if (!date) return '-'

    const d = new Date(date)

    if (isNaN(d)) return date

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /* ================= DISPLAY TIME ================= */

  const displayTime = (time) => {

    if (!time) return '-'

    const d = new Date(time)

    if (isNaN(d)) return time

    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /* ================= FIRST TIMERS (not on the Members list) ================= */

  const memberNameSet = useMemo(
    () => new Set(members.slice(1).map((m) => String(m[1] || '').replace(/\s+/g, ' ').trim().toLowerCase())),
    [members]
  )
  const isFirstTimerRow = (row) =>
    !memberNameSet.has(String(row[1] || '').replace(/\s+/g, ' ').trim().toLowerCase())

  /* ================= DASHBOARD FILTER ================= */

  const dashboardFilteredAttendance = useMemo(() => {

    return attendance.slice(1).filter((row) => {

      const rowDate = new Date(String(row[0]))

      if (isNaN(rowDate)) return false

      if (startDate) {

        const start = new Date(startDate)

        if (rowDate < start) {
          return false
        }
      }

      if (endDate) {

        const end = new Date(endDate)

        end.setHours(23, 59, 59, 999)

        if (rowDate > end) {
          return false
        }
      }

      return true
    })

  }, [attendance, startDate, endDate])

  /* ================= ATTENDANCE TREND ================= */

  const dashboardTrendData = useMemo(() => {

    const groupedData = {}

    dashboardFilteredAttendance.forEach((row) => {

      const date = formatDate(row[0])

      if (!date) return

      groupedData[date] =
        (groupedData[date] || 0) + 1

    })

    return Object.keys(groupedData).map((date) => ({

      name: date,
      value: groupedData[date],

    }))

  }, [dashboardFilteredAttendance])

  /* ================= FIRST TIMER DATA ================= */

  const dashboardFirstTimerData = useMemo(() => {

  const grouped = {}

  dashboardFilteredAttendance.forEach((row) => {

    const date = displayDate(row[0])

    if (!date) return

    if (!grouped[date]) {

      grouped[date] = {
        name: date,
        regular: 0,
        firstTimers: 0,
      }

    }

    if (isFirstTimerRow(row)) {

      grouped[date].firstTimers += 1

    } else {

      grouped[date].regular += 1

    }

  })

  return Object.values(grouped)

}, [dashboardFilteredAttendance, memberNameSet])

const financeChartData = useMemo(() => {

  const grouped = {}

  finance.forEach((f) => {

    if (f.giving !== 'Tithes and Offering') return

    const date = new Date(f.date)
    if (isNaN(date)) return

    const key = formatDate(date)

    grouped[key] =
      (grouped[key] || 0) + Number(f.amount || 0)
  })

  return Object.keys(grouped).map((date) => ({
    name: date,
    amount: grouped[date],
  }))

}, [finance])

  /* ================= ATTENDANCE FILTER ================= */

  const filteredAttendance = useMemo(() => {

    const q = search.trim().toLowerCase()

    return attendance
      .slice(1)
      .filter((row) => {

        const rowDate = formatDate(row[0])

        if (startDate && rowDate < startDate) return false
        if (endDate && rowDate > endDate) return false

        if (q && !String(row[1] || '').toLowerCase().includes(q)) {
          return false
        }

        return true
      })

  }, [attendance, startDate, endDate, search])

  const attTotalPages = Math.max(
    1,
    Math.ceil(filteredAttendance.length / attPageSize)
  )

  const attCurrentPage = Math.min(attPage, attTotalPages)

  const attStart = (attCurrentPage - 1) * attPageSize

  const attendancePageRows = printAll
    ? filteredAttendance
    : filteredAttendance.slice(attStart, attStart + attPageSize)

  // back to page 1 whenever the filters change
  useEffect(() => {
    setAttPage(1)
  }, [startDate, endDate, search, attPageSize])

  // print every record, not just the visible page
  const printAttendance = () => {
    setPrintAll(true)
    setTimeout(() => {
      window.print()
      setPrintAll(false)
    }, 150)
  }

  /* ================= EVENTS FILTER ================= */

  const searchedEvents = useMemo(() => {

    return events.slice(1).filter((e) => {

      const rowDate = formatDate(e[0])

      if (startDate && rowDate !== startDate) {
        return false
      }

      if (
        search &&
        !e[1]
          ?.toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false
      }

      return true
    })

  }, [events, startDate, search])

  /* ================= LEADERS ================= */

  const sortedLeaders = useMemo(() => {

    return leaders
      .slice(1)
      .sort((a, b) =>
        a[1]?.localeCompare(b[1])
      )

  }, [leaders])

  return (

    <main className="dashboard">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* MOBILE TOPBAR */}
      <div className="mobile-topbar glass">

        <button
          className="hamburger"
          onClick={() =>
            setSidebarOpen(true)
          }
        >
          <Menu size={22} />
        </button>

        <h2>TRCF YJ Dashboard</h2>

      </div>

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          sidebarOpen ? 'mobile-open' : ''
        }`}
      >

        <div>

          <div className="brand">
            <img
              src="/Add a heading.png"
              alt="TRCF Youth Jam"
              className="logo"
            />
            <span className="brand-name">
              <Equalizer /> Youth Jam Database
            </span>
          </div>

<div className="menu">

  {ALL_TABS.filter((t) =>
    ROLE_TABS[role].includes(t.name)
  ).map((tab) => (

    <MenuItem
      key={tab.name}
      icon={tab.icon}
      text={tab.name}
      active={activeTab === tab.name}
      onClick={() => {

        setActiveTab(tab.name)
        setSidebarOpen(false)

      }}
    />

  ))}

</div>

        </div>

        <div className="sidebar-user">

          <div className="sidebar-user-info">
            <strong>{session.user.name}</strong>
            <span className={`role-badge ${role}`}>{ROLE_LABEL[role] || role}</span>
          </div>

          <button
            className="sidebar-link"
            onClick={() => setShowPassword(true)}
          >
            <KeyRound size={16} /> Change password
          </button>

          <button
            className="sidebar-link"
            onClick={onLogout}
          >
            <LogOut size={16} /> Log out
          </button>

        </div>

      </aside>

      {showPassword && (
        <ChangePassword
          onClose={() => setShowPassword(false)}
          onDone={(next) => {
            onSessionUpdate(next)
            setShowPassword(false)
            alert('✅ Password updated')
          }}
        />
      )}

      {/* CONTENT */}
      <section className="content">

        {/* TOPBAR */}
        <div className="topbar glass">

          <div>
            <h1>{activeTab}</h1>
            <p>
              {TAB_SUBTITLE[activeTab] || 'TRCF Youth Jam'}
            </p>
          </div>

          <div className="topbar-right">

            <div className="search-box">

              <Search size={16} />

              <input
                placeholder="Search..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>

        </div>
        

        <div key={activeTab} className="tab-view">

        {activeTab === 'Homepage' && (

  <div
    style={{
      width: '100%',
      height: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >

    <img
      src="/Youth Jam Homepage.png"
      alt="Youth Jam Homepage"
      style={{
        marginTop: '0.5in',
        maxWidth: '100%',
        maxHeight: '90vh',
        objectFit: 'contain',
        borderRadius: '24px',
      }}
    />

  </div>
  

)}

        {/* DASHBOARD */}
        {activeTab === 'Dashboard' && (

          !(isLeader || isAdmin) ? (

    <div className="glass panel">

      <h3>
        Access Denied
      </h3>

      <p
        style={{
          marginTop: '10px',
          opacity: 0.7,
        }}
      >
        Only Leaders and Admins can access Follow Up.
      </p>

    </div>

  ) : (

          <>

            <div className="glass dashboard-filter">

              <div>
                <h3>Analytics Range</h3>
                <p>
                  Filter charts by attendance
                  date
                </p>
              </div>

              <div className="dashboard-filter-right">

                <div className="date-input-group">

                  <label>From</label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="date-input-group">

                  <label>To</label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value
                      )
                    }
                  />

                </div>

                <button
                  className="reset-btn"
                  onClick={() => {

                    setStartDate('')
                    setEndDate('')

                  }}
                >
                  Reset
                </button>

              </div>

            </div>

            {/* STATS */}
            <div className="stats-grid">

              <StatCard
                title="Attendance"
                value={
                  dashboardFilteredAttendance.length
                }
                color="blue"
              />

              <StatCard
                title="First Timers"
                value={
                  dashboardFilteredAttendance.filter(isFirstTimerRow).length
                }
                color="green"
              />

              <StatCard
                title="Events"
                value={events.slice(1).length}
                color="orange"
              />

              <StatCard
                title="Giving"
                value={finance.reduce((sum, f) => sum + Number(f.amount || 0), 0)}
                color="purple"
              />

            </div>

            {/* CHARTS */}
<div className="chart-grid">

  {/* Attendance */}
  <div className="glass panel">
    <h3>Attendance Trend</h3>

    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dashboardTrendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={4}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* First Timers */}
  <div className="glass panel">
    <h3>First Timer Analytics</h3>

    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dashboardFirstTimerData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="firstTimers"
          stroke="#f97316"
          strokeWidth={4}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* Finance */}
  <div className="glass panel">
    <h3>Tithes & Offering</h3>

    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={financeChartData}>
        <CartesianGrid strokeDasharray="1 1" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  </div>

</div>


          </>
  )
        )}

{/* ATTENDANCE */}
{activeTab === 'Attendance' && (

  <div className="glass panel attendance-print">

    {/* HEADER */}
    <div className="panel-header attendance-header">

      {/* LEFT */}
      <div>

        <h3>Attendance Records</h3>

        {/* STATS */}
        <div className="attendance-stats-row">

          <div className="event-stat-box blue-stat">

            <span>
              Total Participants
            </span>

            <h3>
              {filteredAttendance.length}
            </h3>

          </div>

          <div className="event-stat-box green-stat">

            <span>
              First Timers
            </span>

            <h3>
              {
                filteredAttendance.filter(isFirstTimerRow).length
              }
            </h3>

          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="attendance-actions no-print">

        <div className="date-input-group">

          <label>From Date</label>

          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />

        </div>

        <div className="date-input-group">

          <label>To Date</label>

          <input
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
          />

        </div>

        <button
          className="finance-reset-btn"
          onClick={() => {

            setStartDate('')
            setEndDate('')

          }}
        >
          Reset
        </button>

        <button
          className="finance-reset-btn"
          onClick={printAttendance}
        >
          Print Records
        </button>

      </div>

    </div>

    {/* TABLE */}
    <div className="table-wrapper table-fit">

      <table>

        <thead>

          <tr>
            <th>Date</th>
            <th>Full Name</th>
            <th>Type</th>
          </tr>

        </thead>

        <tbody>

          {attendancePageRows.length > 0 ? (

            attendancePageRows.map(
              (row, i) => (

                <tr key={attStart + i}>

                  <td>
                    {displayDate(row[0])}
                  </td>

                  <td>{row[1]}</td>

                  <td>{isFirstTimerRow(row) ? 'First timer' : 'Regular'}</td>

                </tr>

              )
            )

          ) : (

            <tr>

              <td
                colSpan="3"
                className="empty-state"
              >
                No attendance records found.
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

    {/* PAGINATION */}
    <div className="pager no-print">

      <div className="pager-info">
        {filteredAttendance.length === 0
          ? 'No records'
          : `Showing ${attStart + 1}–${Math.min(
              attStart + attPageSize,
              filteredAttendance.length
            )} of ${filteredAttendance.length}`}
      </div>

      <div className="pager-controls">

        <label className="pager-size">
          <span>Rows</span>
          <select
            value={attPageSize}
            onChange={(e) => setAttPageSize(Number(e.target.value))}
          >
            {[15, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <button
          className="pager-btn"
          disabled={attCurrentPage === 1}
          onClick={() => setAttPage(1)}
          aria-label="First page"
        >
          «
        </button>

        <button
          className="pager-btn"
          disabled={attCurrentPage === 1}
          onClick={() => setAttPage(attCurrentPage - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>

        <span className="pager-page">
          Page {attCurrentPage} / {attTotalPages}
        </span>

        <button
          className="pager-btn"
          disabled={attCurrentPage === attTotalPages}
          onClick={() => setAttPage(attCurrentPage + 1)}
          aria-label="Next page"
        >
          ›
        </button>

        <button
          className="pager-btn"
          disabled={attCurrentPage === attTotalPages}
          onClick={() => setAttPage(attTotalPages)}
          aria-label="Last page"
        >
          »
        </button>

      </div>

    </div>

  </div>

)}

{/* REGULAR MEMBERS */}
{activeTab === 'Regular Members' && (
  <RegularMembers
    members={members}
    attendance={attendance}
    search={search}
    onChanged={fetchData}
  />
)}

{/* FIRST TIMERS (consolidation team) */}
{activeTab === 'First Timers' && (
  <FirstTimers
    members={members}
    attendance={attendance}
    onChanged={fetchData}
  />
)}

{/* CONSOLIDATION (conso staff enter, conso head follows up) */}
{activeTab === 'Consolidation' && (
  <Consolidation
    me={session.user}
    members={members}
    leaders={leaders}
    consolidation={consolidation}
    refs={refs}
    attendance={attendance}
    onChanged={fetchData}
  />
)}

{/* EVENTS */}
{activeTab === 'Events' && (

  <div className="glass panel calendar-panel">

    <div className="calendar-header">

      <div>
        <h2>Calendar of Activities</h2>

        <p>
          Previous Month, Current Month, Future Month
        </p>
      </div>

            <div className="calendar-filter-group">

  <select
    value={calendarMonth}
    onChange={(e) =>
      setCalendarMonth(
        Number(e.target.value)
      )
    }
  >

    {[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ].map((month, index) => (

      <option
        value={index}
        key={index}
      >
        {month}
      </option>

    ))}

  </select>

  <select
    value={calendarYear}
    onChange={(e) =>
      setCalendarYear(
        Number(e.target.value)
      )
    }
  >

    {Array.from(
      { length: 10 },
      (_, i) => 2023 + i
    ).map((year) => (

      <option
        value={year}
        key={year}
      >
        {year}
      </option>

    ))}

  </select>

</div>

    </div>

{isMobile && (

  <div className="mobile-calendar-nav">

    <button
      className="mobile-calendar-btn"
      onClick={() => {

        if (calendarMonth === 0) {

          setCalendarMonth(11)
          setCalendarYear(calendarYear - 1)

        } else {

          setCalendarMonth(calendarMonth - 1)

        }

      }}
    >
      ⬅
    </button>

    <h2>
      {new Date(
        calendarYear,
        calendarMonth
      ).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      })}
    </h2>

    <button
      className="mobile-calendar-btn"
      onClick={() => {

        if (calendarMonth === 11) {

          setCalendarMonth(0)
          setCalendarYear(calendarYear + 1)

        } else {

          setCalendarMonth(calendarMonth + 1)

        }

      }}
    >
      ➡
    </button>

  </div>

)}

    <div className="calendar-slider-wrapper">

      {/* LEFT BUTTON */}
      <button
        className="calendar-side-btn"
        onClick={() => {

  if (calendarMonth === 0) {

    setCalendarMonth(11)
    setCalendarYear(calendarYear - 1)

  } else {

    setCalendarMonth(calendarMonth - 1)

  }

}}
      >
        ⬅
      </button>

      {/* CALENDARS */}
      <div
  className={
    isMobile
      ? 'single-calendar-grid'
      : 'triple-calendar-grid'
  }
>

        {(isMobile ? [0] : [-1, 0, 1]).map((offset, index) => {

          const calendarDate = new Date(
  calendarYear,
  calendarMonth + offset,
  1
)

          return (

            <div
              className="mini-calendar-box"
              key={index}
            >

              <CalendarView

              view="month"
maxDetail="month"
minDetail="month"
navigationLabel={null}

  prevLabel={null}
  nextLabel={null}
  prev2Label={null}
  next2Label={null}

  showNeighboringMonth={true}

  value={null}

  activeStartDate={calendarDate}

onClickDay={(value) => {

  setSelectedCalendarDate(value)

  const clickedDate =
    formatDate(value)

  /* HOLIDAY CHECK */
  const holiday =
    philippineHolidays.find(
      (h) => h.date === clickedDate
    )

  if (holiday) {

    setSelectedHoliday({
      title: holiday.title,
      description:
        holiday.description,
      date: holiday.date,
    })

  } else {

    setSelectedHoliday(null)
  }

  /* EVENT CHECK */
  const foundEvent =
    events.slice(1).find((e) => {

      const eventDate =
        formatDate(e[0])

      return eventDate === clickedDate
    })

  if (!foundEvent) {

    setSelectedCalendarEvent(null)
    return
  }

  let totalParticipants = 0
  let totalFirstTimers = 0
  let participantList = []

  if (
    foundEvent[1]
      ?.toLowerCase()
      .includes('youth')
  ) {

    participantList =
      youthGetLoud.slice(1)

    totalParticipants =
      participantList.length

    totalFirstTimers =
      participantList.filter((p) => {

        return (
          p[5]
            ?.toString()
            .trim()
            .toLowerCase() === 'yes'
        )

      }).length

  } else {

    participantList =
      attendance
        .slice(1)
        .filter((a) => {

          const attendanceDate =
            formatDate(a[0])

          return (
            attendanceDate === clickedDate
          )
        })

    totalParticipants =
      participantList.length

    totalFirstTimers =
      participantList.filter(isFirstTimerRow).length

    // attendance is Date | FullName, so pull age / leader from Members
    participantList = participantList.map((a) => {
      const key = String(a[1] || '').replace(/\s+/g, ' ').trim().toLowerCase()
      const m = members.slice(1).find(
        (x) => String(x[1] || '').replace(/\s+/g, ' ').trim().toLowerCase() === key
      )
      return [null, a[1], m?.[2], m?.[6], '-', m ? 'No' : 'Yes', '-']
    })
  }

  const rawTime = foundEvent[3]

  let formattedTime = '-'

  if (rawTime) {

    const parsedTime =
      new Date(rawTime)

    if (!isNaN(parsedTime)) {

      formattedTime =
        parsedTime.toLocaleTimeString(
          [],
          {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }
        )

    } else {

      formattedTime = rawTime
    }
  }

const eventType = foundEvent[5]

setSelectedCalendarEvent({
  title: foundEvent[1],
  location: foundEvent[2],
  time: formattedTime,
  status: foundEvent[4],
  date: foundEvent[0],
  eventType, // ✅ ADD THIS

  participants: totalParticipants,
  firstTimers: totalFirstTimers,
})

  setSelectedEventParticipants({

    title: foundEvent[1],

    participants:
      participantList.map((p) => [

        p[1] || '-',
        p[2] || '-',
        p[3] || '-',
        p[4] || '-',
        p[5] || '-',
        p[6] || '-',
      ]),
  })
}}

  tileClassName={({ date, view }) => {

    if (view !== 'month') return null

    const hasEvent =
      events
        .slice(1)
        .find((e) => {

          const eventDate = new Date(e[0])

          if (isNaN(eventDate)) return false

          return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
          )
        })

    return hasEvent
      ? 'event-day'
      : null
  }}
/>

            </div>

          )
        })}

      </div>

      {/* RIGHT BUTTON */}
      <button
        className="calendar-side-btn"
        onClick={() => {

  if (calendarMonth === 11) {

    setCalendarMonth(0)
    setCalendarYear(calendarYear + 1)

  } else {

    setCalendarMonth(calendarMonth + 1)

  }

}}
      >
        ➡
      </button>

    </div>

  </div>

)}


{selectedCalendarEvent && ( 
  <div
    className="leader-popup-overlay"
    onClick={() => {
      setSelectedCalendarEvent(null)
      setSelectedEventParticipants(null)
    }}
  >
    <div
      className={`event-popup-layout ${
        isDetailsOnly ? "single-mode" : ""
      }`}
      onClick={(e) => e.stopPropagation()}
    >

      {/* LEFT SIDE */}
      <div className="event-popup-left">
        <h2>{selectedCalendarEvent.title}</h2>

        <div className="event-info-list">
          <div className="event-info-card">
            <span>📅 Date</span>
            <h4>{displayDate(selectedCalendarEvent.date)}</h4>
          </div>

          <div className="event-info-card">
            <span>🕒 Time</span>
            <h4>{selectedCalendarEvent.time}</h4>
          </div>

          <div className="event-info-card">
            <span>📍 Location</span>
            <h4>{selectedCalendarEvent.location}</h4>
          </div>

          <div className="event-info-card">
            <span>📌 Status</span>
            <h4>{selectedCalendarEvent.status}</h4>
          </div>
        </div>
      </div>

      {/* MIDDLE (ONLY IF NOT DETAILS_ONLY) */}
      {!isDetailsOnly && (
        <div className="event-popup-middle">

          <div className="event-participant-scroll">
            <h1>LIST OF PARTICIPANTS</h1>
            {selectedEventParticipants?.participants?.length > 0 ? (
              selectedEventParticipants.participants.map((p, i) => (
                <div className="popup-member-card" key={i}>
                  <div className="popup-member-top">
                    <span>{i + 1}.</span>
                    <h4>{p[0]}</h4>
                  </div>

                  <div className="followup-body">
                    <p>🎂 Age: {p[1]}</p>
                    <p>🙋 Invited By: {p[2]}</p>
                    <p>🏫 School: {p[3]}</p>
                    <p>✨ First Timer: {p[4]}</p>
                    <p>📜 Reminder Agreement: {p[5]}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ opacity: 0.6 }}>No participant data for this event.</p>
            )}
          </div>

        </div>
      )}

      {/* RIGHT SIDE (ONLY IF NOT DETAILS_ONLY) */}
      {!isDetailsOnly && (
        <div className="event-popup-right">

          <button
            className="event-close-btn"
            onClick={() => {
              setSelectedCalendarEvent(null)
              setSelectedEventParticipants(null)
            }}
          >
            ✕
          </button>

          <div className="event-stat-box blue-stat">
            <span>Total Participants</span>
            <h3>{selectedCalendarEvent.participants}</h3>
          </div>

          <div className="event-stat-box green-stat">
            <span>Total First Timers</span>
            <h3>{selectedCalendarEvent.firstTimers}</h3>
          </div>

        </div>
      )}

    </div>
  </div>
)}

{/* LEADERS */}
{activeTab === 'Leaders' && (

  <div className="glass panel">

    <h3>Leaders</h3>

    <div className="leaders-grid">

      {sortedLeaders.map((l, i) => {

        const members =
  l[3]
    ?.split(/\r?\n|,/)
    .map((member) =>
      member
        .replace(/"/g, '')
        .trim()
    )
    .filter(Boolean) || []

        return (

          <div
            className="leader-card clickable"
            key={i}
            onClick={() =>
              setSelectedLeader({
                name: l[1],
                members,
                leaderData: l,
                level: 'main',
              })
            }
          >

            <div className="leader-avatar">
              {l[1]?.charAt(0)}
            </div>

            <h2>{l[1]}</h2>

            <p>{l[0]}</p>

            <div className="leader-meta">

              <span>
                👥 {Number(l[2] || 0)} Members
              </span>

              <span>
                📞 {l[4]}
              </span>

            </div>

          </div>

        )
      })}

    </div>

  </div>
)}

{/* LEADER POPUP */}
{selectedLeader && (

  <div
    className="leader-popup-overlay"
    onClick={() =>
      setSelectedLeader(null)
    }
  >

    <div
      className="leader-popup"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      <div className="popup-header">

        <h2>
          {selectedLeader.name}'s Members
        </h2>

        <button
          className="popup-close"
          onClick={() =>
            setSelectedLeader(null)
          }
        >
          ✕
        </button>

      </div>

      <div className="popup-members">

        {selectedLeader.members.length > 0 ? (

          selectedLeader.members.map(
            (member, index) => {

              const leaderData =
                selectedLeader.leaderData

              const memberName =
                member
                  .trim()
                  .toLowerCase()

              const cleanArray = (value) =>
  value
    ?.split(/\r?\n|,/)
    .map((m) =>
      m
        .replace(/"/g, '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean) || []

              const closecell =
                cleanArray(leaderData?.[5])

              const underRaw = leaderData?.[6] || ''

let underMembers = []

underRaw
  .split('\n')
  .forEach((line) => {

    const parts = line.split(':')

    if (parts.length < 2) return

    const leaderName =
      parts[0]
        .trim()
        .toLowerCase()

    if (leaderName !== memberName) return

    underMembers =
      parts[1]
        .split('|')
        .map((m) => m.trim())
        .filter(Boolean)

  })

              const suynl =
                cleanArray(leaderData?.[7])

              const lifeclass =
                cleanArray(leaderData?.[8])

              const sol1 =
                cleanArray(leaderData?.[9])

              const sol2 =
                cleanArray(leaderData?.[10])

              const sol3 =
                cleanArray(leaderData?.[11])

              const isClosecell =
                closecell.includes(memberName)

              return (

                <div
                  className="popup-member-card"
                  key={index}
                >

                  <div
  className={`popup-member-top ${
    isClosecell
      ? 'clickable'
      : ''
  }`}
  onClick={() => {

    if (!isClosecell) return

    setExpandedClosecell(
      expandedClosecell === member
        ? null
        : member
    )
  }}
>

                    <span>
                      {index + 1}.
                    </span>

                    <h4>
                      {member}

                      {isClosecell && ' 🔥'}
                    </h4>

                  </div>

                  <div className="disciple-grid">

  {isClosecell && (
    <div className="disciple-badge closecell">
      CLOSECELL
    </div>
  )}

  <div className={`disciple-badge ${
    suynl.includes(memberName)
      ? 'done'
      : ''
  }`}>
    SUYNL
  </div>

  <div className={`disciple-badge ${
    lifeclass.includes(memberName)
      ? 'done'
      : ''
  }`}>
    LIFECLASS
  </div>

  <div className={`disciple-badge ${
    sol1.includes(memberName)
      ? 'done'
      : ''
  }`}>
    SOL1
  </div>

  <div className={`disciple-badge ${
    sol2.includes(memberName)
      ? 'done'
      : ''
  }`}>
    SOL2
  </div>

  <div className={`disciple-badge ${
    sol3.includes(memberName)
      ? 'done'
      : ''
  }`}>
    SOL3
  </div>

</div>

{expandedClosecell === member &&
  underMembers.length > 0 && (

  <div className="under-members-box">

    <h4>Under Members</h4>

    {underMembers.map((u, idx) => {

      const underName =
        u.trim().toLowerCase()

      return (

        <div
          className="under-member-item"
          key={idx}
        >

          <div className="under-member-name">
            {u}
          </div>

          <div className="disciple-grid">

            <div className={`disciple-badge ${
              suynl.includes(underName)
                ? 'done'
                : ''
            }`}>
              SUYNL
            </div>

            <div className={`disciple-badge ${
              lifeclass.includes(underName)
                ? 'done'
                : ''
            }`}>
              LIFECLASS
            </div>

            <div className={`disciple-badge ${
              sol1.includes(underName)
                ? 'done'
                : ''
            }`}>
              SOL1
            </div>

            <div className={`disciple-badge ${
              sol2.includes(underName)
                ? 'done'
                : ''
            }`}>
              SOL2
            </div>

            <div className={`disciple-badge ${
              sol3.includes(underName)
                ? 'done'
                : ''
            }`}>
              SOL3
            </div>

          </div>

        </div>

      )
    })}

  </div>

)}

</div>

              )
            }
          )

        ) : (

          <p>No members found.</p>

        )}

      </div>

    </div>

  </div>

)}

        {activeTab === 'FollowUp' && (

  !(isLeader || isAdmin) ? (

    <div className="glass panel">

      <h3>
        Access Denied
      </h3>

      <p
        style={{
          marginTop: '10px',
          opacity: 0.7,
        }}
      >
        Only Leaders and Admins can access Follow Up.
      </p>

    </div>

  ) : (

          <div className="glass panel">

            <div className="panel-header">

              <div>

                <h3>Follow Up Tracker</h3>

                <p className="attendance-count">

                  Total Follow Ups:{' '}
                  {followup.slice(1).length}

                </p>

              </div>
              <button
  className="reset-btn"
  style={{ marginTop: "10px" }}
  onClick={async () => {

  if (window.sendingBulkQR) return

  window.sendingBulkQR = true

  await handleSendFirstTimersBulk()

  window.sendingBulkQR = false
}}
>
  Send Welcome QR (ALL)
</button>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="table-date"
              />

            </div>

            <div className="followup-grid">

              {followup
                .slice(1)
                .filter((f) => {

                  if (!startDate)
                    return true

                  return (
                    formatDate(f[0]) ===
                    startDate
                  )
                })
                .map((f, i) => (
                  

                  <div
                    className="followup-card"
                    key={i}
                  >

                    <div className="followup-top">

                      <div>

                        <h2>{f[1]}</h2>

                        <div className="followup-date">

                          📅{' '}
                          {displayDate(f[0])}

                        </div>

                      </div>

                      <span className="followup-status">
                        {f[7]}
                      </span>

                    </div>

                    <div className="followup-body">

                      <p>
                        🎂 Age: {f[2]}
                      </p>

                      <p>
                        👤 Gender: {f[3]}
                      </p>

                      <p>
                        🙋 Invited By:{' '}
                        {f[4]}
                      </p>

                      <p>
                        📆 Follow Up Date:{' '}
                        {displayDate(f[5])}
                      </p>

                      <p>
                        📞 Method: {f[6]}
                      </p>

                    </div>

                  </div>

                )
                )}

            </div>

          </div>
  )
        )}
        

{/* FINANCE */}
{activeTab === 'Finance' && (

  !(isLeader || isAdmin) ? (

    <div className="glass panel">

      <h3>Access Denied</h3>

      <p
        style={{
          marginTop: '10px',
          opacity: 0.7,
        }}
      >
        Only Leaders and Admins can access Finance.
      </p>

    </div>

  ) : (

    <div className="finance-wrapper finance-print">

      {(() => {

        const filteredFinance = finance.filter((f) => {

          if (!f.date || !f.amount)
            return false

          const date =
            new Date(f.date)

          if (isNaN(date))
            return false

          const formatted =
            formatDate(date)

          if (
            startDate &&
            formatted < startDate
          ) return false

          if (
            endDate &&
            formatted > endDate
          ) return false

          return true

        })

        const totalGiving =
          filteredFinance.reduce(
            (sum, f) =>
              sum +
              Number(
                String(
                  f.amount || 0
                ).replace(/,/g, '')
              ),
            0
          )

        return (

          <>

            <div className="stats-grid">

              <StatCard
                title="Total Giving"
                value={`₱${totalGiving.toLocaleString()}.00`}
                color="blue"
              />

            </div>

            <div className="glass panel finance-panel">

              <div
                className="panel-header"
              >

                <div>

                  <h3>
                    Finance Records
                  </h3>

                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}
                >

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(
                        e.target.value
                      )
                    }
                    className="no-print"
                  />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value
                      )
                    }
                    className="no-print"
                  />

                  <button
                    className="finance-reset-btn no-print"
                    onClick={() => {

                      setStartDate('')
                      setEndDate('')

                    }}
                  >
                    Reset
                  </button>

                  <button
                    className="finance-reset-btn no-print"
                    onClick={() =>
                      window.print()
                    }
                  >
                    Print Records
                  </button>

                </div>

              </div>

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>Date</th>
                      <th>Giving</th>
                      <th>Amount</th>
                      <th>Program</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredFinance.length > 0 ? (

                      filteredFinance.map(
                        (f, i) => (

                          <tr key={i}>

                            <td>
                              {displayDate(
                                f.date
                              )}
                            </td>

                            <td>
                              {f.giving}
                            </td>

                            <td>
                              ₱
                              {Number(
                                f.amount
                              ).toLocaleString()}
                            </td>

                            <td>
                              {f.program}
                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="4"
                          className="empty-state"
                        >
                          No finance records found
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </>

        )

      })()}

    </div>

  )
)}

{/* QR SCANNER */}
{activeTab === 'Manage Data' && (

  <ManageData
    role={role}
    refs={refs}
    search={search}
    onChanged={fetchData}
    data={{
      attendance,
      members,
      followup,
      events,
      leaders,
      finance,
    }}
  />

)}

        {activeTab === 'QR Scan' && (

  !(isLeader || isAdmin) ? (

    <div className="glass panel">

      <h3>Access Denied (Admin Only)</h3>

      <p
        style={{
          marginTop: '10px',
          opacity: 0.7,
        }}
      >
        Only admins can access the QR Scanner.
      </p>

    </div>

  ) : (

    <div className="glass panel">

      <h2>Member QR Scanner</h2>

      <p className="scanner-subtitle">
        Scan TRCF Member QR Code
      </p>

      {!isStandalone ? (

        <div className="scanner-warning">
          ⚠ Install the app first to use scanner.
        </div>

      ) : (

        <>

          {/* SHOW CAMERA ONLY IF NO RESULT */}
          {!scanResult && (
            <div
              id="reader"
              className="scanner-box"
            />
          )}

          {/* RESULT CARD */}
          {scanResult && (

            <div className="scan-result-card fade-in">

              <div className="scan-left">

                <h3>
                  ✅ Attendance Saved
                </h3>

                <p>
                  <strong>ID:</strong>{' '}
                  {scanResult.MemberID}
                </p>

                <p>
                  <strong>Name:</strong>{' '}
                  {scanResult.FullName}
                </p>

                <p>
                  <strong>Age:</strong>{' '}
                  {scanResult.Age}
                </p>

                <p>
                  <strong>Gender:</strong>{' '}
                  {scanResult.Gender}
                </p>

                <p>
                  <strong>Leader:</strong>{' '}
                  {scanResult.LGLeader}
                </p>

              </div>

              {/* RIGHT SIDE BUTTON */}
              <div className="scan-right">

                <button
                  className="scan-next-btn"
                  onClick={async () => {

                    setScanResult(null)
                    setScannerError('')

                    if (scannerInstance) {

                      try {

                        await scannerInstance.clear()

                      } catch (e) {}

                      const reader =
                        document.getElementById('reader')

                      if (reader) {
                        reader.innerHTML = ''
                      }

                      const newScanner =
                        new Html5QrcodeScanner(
                          'reader',
                          {
                            fps: 5,
                            qrbox: 260,
                          },
                          false
                        )

                      setScannerInstance(newScanner)

                      let isScanning = false

                      newScanner.render(

                        async (decodedText) => {

                          if (isScanning) return

                          isScanning = true

                          let memberId = decodedText

                          if (
                            decodedText.startsWith(
                              'TRCF_MEMBER:'
                            )
                          ) {

                            memberId =
                              decodedText.replace(
                                'TRCF_MEMBER:',
                                ''
                              )
                          }

                          memberId =
                            memberId
                              .toString()
                              .trim()

                          const cleanMemberId =
                            memberId
                              .replace(/\s/g, '')
                              .toLowerCase()

                          const foundMember =
                            members
                              .slice(1)
                              .find((m) => {

                                const sheetId =
                                  String(m[0] || '')
                                    .trim()
                                    .replace(/\s/g, '')
                                    .toLowerCase()

                                return (
                                  sheetId === cleanMemberId
                                )

                              })

                          if (foundMember) {

                            try {

                              await newScanner.clear()

                              await api('scan', { id: memberId })

                            } catch (err) {}

                            setScanResult({

                              MemberID: foundMember[0],
                              FullName: foundMember[1],
                              Age: foundMember[2],
                              Gender: foundMember[3],
                              Contact: foundMember[4],
                              Email: foundMember[5],
                              LGLeader: foundMember[6],

                            })

                            setScannerError('')

                          } else {

                            setScanResult(null)

                            setScannerError(
                              `Member not found: ${memberId}`
                            )
                          }

                          setTimeout(() => {
                            isScanning = false
                          }, 2500)

                        },

                        () => {}

                      )
                    }

                  }}
                >
                  Scan Next QR
                </button>

              </div>

            </div>

          )}

          {scannerError && (

            <p className="scanner-error">
              {scannerError}
            </p>

          )}

        </>

      )}

      <br />

      <div className="qr-generator-box">

        <h3>QR Code Generator</h3>

        <input
          type="text"
          placeholder="Enter MemberID"
          value={qrMemberId}
          onChange={(e) =>
            setQrMemberId(e.target.value)
          }
          className="qr-input"
        />

        <button
          className="reset-btn"
          onClick={() => {

            if (!qrMemberId) return

            const qrData =
  `TRCF_MEMBER:${qrMemberId}`

QRCode.toDataURL(qrData)
  .then((url) => {

    setGeneratedQR(url)

  })

          }}
        >
          Generate QR
        </button>

        {generatedQR && (

  <div className="generated-qr-preview">

    <div
      id="qr-card"
      style={{
        position: 'relative',
        width: '380px',
height: '475px',
        margin: 'auto',
        overflow: 'hidden',
        borderRadius: '20px'
      }}
    >

      {/* TEMPLATE */}
      <img
        src="/templates/youthjam-template.jpg"
        alt="Template"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0
        }}
      />

      {/* QR */}
      <img
        src={generatedQR}
        alt="QR"
        style={{
  position: 'absolute',
  left: '50.7%',
  transform: 'translateX(-50%)',
top: '75px',
width: '200px',
height: '200px',
  background: 'white',
  padding: '8px'
}}
      />

      {/* NAME */}
      <div
        style={{
          position: 'absolute',
          top: '306px',
          width: '100%',
          left: '5px',
          textAlign: 'center'
        }}
      >

        <h2
          style={{
            color: '#000000',
            fontSize: '14px',
fontWeight: 'bold',
          }}
        >
          {(selectedMember?.[1] || qrMemberId).toUpperCase()}
        </h2>

      </div>

      {/* LEADER */}
      <div
        style={{
          position: 'absolute',
          top: '350px',
          width: '100%',
          left: '5px',
          textAlign: 'center'
        }}
      >

        <p
          style={{
            color: '#000000',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {(selectedMember?.[6] || 'NO LEADER').toUpperCase()}
        </p>

      </div>

    </div>

    <br />

    <button
      className="reset-btn"
      onClick={async () => {

        const card =
          document.getElementById('qr-card')

        const canvas =
          await html2canvas(card, {
            scale: 3
          })

        const link =
          document.createElement('a')

        link.download =
          `${qrMemberId}-TRCF.png`

        link.href =
          canvas.toDataURL('image/png')

        link.click()

      }}
    >
      Download QR Card
    </button>

  </div>

)}

      </div>

    </div>

  )

)}


{/* =========================
    ACCOUNTS (login + notifications) + HISTORY
========================== */}

  {activeTab === 'Accounts' && (

    <>

      {isLeader && <AccountsPanel me={session.user} />}

      {!isLeader && (
        <div className="glass panel">
          <h3>Access Denied (Leader Only)</h3>
        </div>
      )}

{/* =========================
  HISTORY LOGS PANEL
========================== */}

{isLeader && (

  <div
    className="glass panel"
    style={{ marginTop: '24px' }}
  >

    <div className="panel-header">

      <div>

        <h3>History Logs</h3>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginTop: '12px',
            marginBottom: '18px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >

          <div className="date-input-group">

            <label>From</label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

          </div>

          <div className="date-input-group">

            <label>To</label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

          </div>

          <button
            className="reset-btn"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Reset
          </button>

        </div>

        <p className="attendance-count">
          System Activity Tracker
        </p>

      </div>

    </div>

    <div className="table-wrapper">

      <table>

        <thead>

          <tr>
            <th>Date & Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Sheet</th>
            <th>Details</th>
          </tr>

        </thead>

        <tbody>

          {history.length > 1 ? (

            history
              .slice(1)

              // ✅ FIXED FILTER (NO formatDate BUG)
              .filter((h) => {

                const rawDate = h[0];
                const logDate = rawDate ? new Date(rawDate) : null;

                const logDateString =
                  logDate && !isNaN(logDate.getTime())
                    ? logDate.toISOString().split('T')[0]
                    : '';

                if (startDate && logDateString < startDate) return false;
                if (endDate && logDateString > endDate) return false;

                return true;
              })

              .reverse()

              .map((h, i) => {

                const rawDate = h[0];

                // ✅ SAFE DATE PARSE
                const parsedDate =
                  rawDate ? new Date(rawDate) : null;

                const formattedDate =
                  parsedDate && !isNaN(parsedDate.getTime())
                    ? parsedDate.toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })
                    : '-';

                const action =
                  (h[2] || '').toString().toUpperCase();

                const sheet = h[3] || '-';

                const cell = h[4] || '';

                const rowMatch = cell.match(/\d+/);
                const row = rowMatch ? rowMatch[0] : '';

                return (
                  <tr key={i}>

                    <td>{formattedDate}</td>

                    <td>{h[1] || '-'}</td>

                    <td>
                      <span
                        className={`history-action ${
                          action === 'ADD'
                            ? 'history-add'
                            : action === 'EDIT'
                            ? 'history-edit'
                            : action === 'DELETE'
                            ? 'history-delete'
                            : ''
                        }`}
                      >
                        {action}
                      </span>
                    </td>

                    <td>{sheet}</td>

                    <td style={{ maxWidth: '350px', wordBreak: 'break-word' }}>
                      {action === 'ADD'
                        ? `Added ${sheet} Row ${row}`
                        : action === 'EDIT'
                        ? `Edited ${sheet} Row ${row}`
                        : action === 'DELETE'
                        ? `Deleted ${sheet} Row ${row}`
                        : `${sheet} Row ${row}`}
                    </td>

                  </tr>
                );

              })

          ) : (

            <tr>
              <td colSpan="5" className="empty-state">
                No history logs found.
              </td>
            </tr>

          )}

        </tbody>

      </table>

    </div>

  </div>

)}

    </>

  )}
        </div>

      </section>

    </main>

    
  )
}



/* ================= COMPONENTS ================= */

function MenuItem({
  icon,
  text,
  active,
  onClick,
}) {

  return (

    <button
      type="button"
      className={`menu-item ${
        active ? 'active' : ''
      }`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >

      {icon}

      <span>{text}</span>

    </button>
  )
}

/* the "Jam" motif: five equalizer bars */
function Equalizer({ live = false }) {
  return (
    <span className={`eq ${live ? 'live' : ''}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  )
}

/* counts up once when the number appears or changes */
function CountUp({ value }) {

  const [shown, setShown] = useState(
    typeof value === 'number' ? 0 : value
  )

  useEffect(() => {

    if (typeof value !== 'number') {
      setShown(value)
      return
    }

    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || value === 0) {
      setShown(value)
      return
    }

    let raf
    const t0 = performance.now()
    const dur = 700

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)

  }, [value])

  return typeof shown === 'number'
    ? shown.toLocaleString()
    : shown
}

function StatCard({
  title,
  value,
  color,
}) {

  return (

    <div className={`stat-card ${color}`}>

      <div>

        <p>{title}</p>

        <h2><CountUp value={value} /></h2>

      </div>

    </div>
  )
}

/* ================= LOGIN GATE ================= */

export default function Page() {

  // undefined = still checking localStorage, null = logged out
  const [session, setSession] = useState(undefined)

  useEffect(() => {

    setSession(loadSession())

    const expired = () => setSession(null)

    window.addEventListener('trcf-auth-expired', expired)

    return () =>
      window.removeEventListener('trcf-auth-expired', expired)

  }, [])

  if (session === undefined) {
    return <main className="login-page" />
  }

  if (!session) {

    return (
      <LoginScreen
        onLogin={(next) => {
          saveSession(next)
          setSession(next)
        }}
      />
    )
  }

  return (
    <Dashboard
      key={session.user.username}
      session={session}
      onSessionUpdate={setSession}
      onLogout={() => {
        clearSession()
        setSession(null)
      }}
    />
  )
}
