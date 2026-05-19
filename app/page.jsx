'use client'

import axios from 'axios'
import { Html5QrcodeScanner } from 'html5-qrcode'
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
} from 'lucide-react'

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

const API_URL =
  'https://script.google.com/macros/s/AKfycbyOrJ6PAmXP9jxNfaLA8Mnfzl0z8eZYm-4lbkV7XGFDCYJqqG06hTtSt7bYj-vql50/exec'

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

export default function Page() {
  const [currentUser, setCurrentUser] =
  useState('')
  useEffect(() => {
  const saved =
    localStorage.getItem("currentUser")

  if (saved) {
    setCurrentUser(saved)
  }
}, [])

const handleSendFirstTimersBulk = async () => {

  try {

    const url =
      `${API_URL}?action=sendFirstTimersBulk&date=${startDate}`

    console.log("SENDING TO:", url)

    const res = await fetch(url, {
      method: 'GET',
    })

    const data = await res.json()

    console.log(data)

    if (data.success) {

      alert(
        `✅ Welcome QR sent to ${data.total} people`
      )

    } else {

      alert("❌ Failed to send")
    }

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
  const [users, setUsers] = useState([])
const [selectedUsers, setSelectedUsers] = useState([])
const [isLeader, setIsLeader] = useState(false)
const [history, setHistory] = useState([])
const [isAdmin, setIsAdmin] = useState(false)
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
          await fetch(
            `${API_URL}?action=scan&id=${encodeURIComponent(memberId)}&key=TRCF_SECRET_2026`
          )

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

  if (!users.length) return

  async function checkLeader() {

    if (!window.OneSignal) return

    const subId =
      window.OneSignal?.User
        ?.PushSubscription?.id

    console.log("CURRENT DEVICE ID:", subId)

    if (!subId) {
      setIsLeader(false)
      return
    }

    const foundUser = users
      .slice(1)
      .find(u => u[3] === subId)

    console.log("FOUND USER:", foundUser)

    if (!foundUser) {
      setIsLeader(false)
      return
    }

    const role =
      (foundUser[2] || "")
        .toString()
        .trim()
        .toLowerCase()

    console.log("ROLE:", role)

    setIsLeader(role === "leader")
setIsAdmin(role === "admin")
  }

  checkLeader()

}, [users])

useEffect(() => {

  async function setupUser() {

    if (!window.OneSignal) return

    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches

    if (!isInstalled) return

  const subscriptionId =
  window.OneSignal?.User
    ?.PushSubscription?.id

console.log(
  "ONESIGNAL ID:",
  subscriptionId
)

if (!subscriptionId) {
  console.log("NO SUBSCRIPTION ID")
  return
}

    const response = await fetch("/api/saveUser", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: '',
    gender: '',
    role: 'staff',
    onesignalId: subscriptionId,
    status: 'active',
    device: /Android|iPhone/i.test(navigator.userAgent)
      ? 'Mobile'
      : 'Desktop',
    browser: navigator.userAgent,
  }),
})

const result = await response.json()

console.log(result)

alert("✅ User saved!")

  }

  setupUser()

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

      const res = await axios.get(
  `${API_URL}?t=${Date.now()}`
)

      setAttendance(res.data.attendance || [])
setEvents(res.data.events || [])
setLeaders(res.data.leaders || [])
setFollowup(res.data.followup || [])
setFinance(res.data.finance || [])
setUsers(res.data.users || [])
setHistory(
  res.data.history || []
)
setMembers(res.data.members || [])
      setYouthGetLoud(
  res.data.youthgetloud || []
)
      setYglParticipants(res.data.youthgetloud || [])
      console.log(res.data.finance)

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

    const firstTimer =
      row[5]
        ?.toString()
        .toLowerCase()

    if (firstTimer === 'yes') {

      grouped[date].firstTimers += 1

    } else {

      grouped[date].regular += 1

    }

  })

  return Object.values(grouped)

}, [dashboardFilteredAttendance])

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

    return attendance.slice(1).filter((row) => {

      const rowDate = formatDate(row[0])

      if (startDate && rowDate !== startDate) {
        return false
      }

      if (
        search &&
        !row[2]
          ?.toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false
      }

      return true
    })

  }, [attendance, startDate, search])

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

          <div className="logo-wrapper">
            <img
              src="/Add a heading.png"
              className="logo"
            />
          </div>

<div className="menu">

  {[
    {
      name: 'Homepage',
      icon: <Home size={18} />,
    },
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: 'Attendance',
      icon: <ClipboardList size={18} />,
    },
    {
      name: 'Events',
      icon: <Calendar size={18} />,
    },
    {
      name: 'Leaders',
      icon: <Users size={18} />,
    },
    // ONLY SHOW FINANCE
// IF LEADER OR ADMIN
...(isLeader
  ? [{
      name: 'Finance',
      icon: <HandCoins size={18} />,
    }]
  : []),

    // ONLY SHOW FOLLOWUP
    // IF LEADER OR ADMIN
    ...(isLeader || isAdmin
      ? [{
          name: 'FollowUp',
          icon: <UserRoundCheck size={18} />,
        }]
      : []),

    // ONLY SHOW QR SCAN
    // IF ADMIN
    ...(isLeader || isAdmin
      ? [{
          name: 'QR Scan',
          icon: <QrCode size={18} />,
        }]
      : []),

    // ONLY SHOW ADMIN
    // IF LEADER OR ADMIN
    ...(isLeader
      ? [{
          name: 'Admin',
          icon: <Shield size={18} />,
        }]
      : []),

  ].map((tab) => (

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

      </aside>

      {/* CONTENT */}
      <section className="content">

        {/* TOPBAR */}
        <div className="topbar glass">

          <div>
            <h1>{activeTab}</h1>
            <p>
              TRCF Youth Jam Analytics Dashboard
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
                  dashboardFilteredAttendance.filter(
                    (r) =>
                      r[5]
                        ?.toString()
                        .toLowerCase() === 'yes'
                  ).length
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
        )}

        {/* ATTENDANCE */}
        {activeTab === 'Attendance' && (

          <div className="glass panel">

            <div className="panel-header">

              <div>
                <h3>Attendance Records</h3>
              </div>

              <div className="event-stats">

                <div className="event-stat-box blue-stat">
                  <span>
                    Total Participants
                  </span>

                  <h3>
                    {filteredAttendance.length}
                  </h3>
                </div>

                <div className="event-stat-box green-stat">

                  <span>First Timers</span>

                  <h3>
                    {
                      filteredAttendance.filter(
                        (row) =>
                          row[5]
                            ?.toString()
                            .toLowerCase() ===
                          'yes'
                      ).length
                    }
                  </h3>

                </div>

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

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Date</th>
                    <th>Theme</th>
                    <th>Full Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>First Timer</th>
                    <th>Contact</th>
                    <th>LG Leader</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredAttendance.length >
                  0 ? (

                    filteredAttendance.map(
                      (row, i) => (

                        <tr key={i}>

                          <td>
                            {displayDate(
                              row[0]
                            )}
                          </td>

                          <td>{row[1]}</td>

                          <td>{row[2]}</td>

                          <td>{row[3]}</td>

                          <td>{row[4]}</td>

                          <td>{row[5]}</td>

                          <td>{row[6]}</td>

                          <td>{row[7]}</td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="8"
                        className="empty-state"
                      >
                        No attendance records
                        found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>
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
      participantList.filter((a) => {

        return (
          a[5]
            ?.toString()
            .trim()
            .toLowerCase() === 'yes'
        )

      }).length
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

  <div className="finance-wrapper">

    {/* TOTAL GIVING CARD */}
    {(() => {
      const filteredFinance = finance.filter((f) => {

      if (!f.date || !f.amount) return false

      const date = new Date(f.date)
      if (isNaN(date)) return false

      const formatted = formatDate(date)

      if (startDate && formatted < startDate) return false
      if (endDate && formatted > endDate) return false

      return true
    })

      const totalGiving = filteredFinance.reduce(
        (sum, f) =>
          sum +
          Number(
            String(f.amount || 0).replace(/,/g, '')
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

          {/* FINANCE TABLE PANEL */}
          <div className="glass panel finance-panel">
            <h3>Finance Records</h3>

            <div className="finance-filter-row">

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
                    filteredFinance.map((f, i) => (
                      <tr key={i}>
                        <td>{displayDate(f.date)}</td>
                        <td>{f.giving}</td>
                        <td>₱{Number(f.amount).toLocaleString()}</td>
                        <td>{f.program}</td>
                      </tr>
                    ))
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

                              await fetch(
                                `${API_URL}?action=scan&id=${encodeURIComponent(memberId)}&key=TRCF_SECRET_2026`
                              )

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

            const qrUrl =
              `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`

            setGeneratedQR(qrUrl)

          }}
        >
          Generate QR
        </button>

        {generatedQR && (

          <div className="generated-qr-preview">

            <img
              src={generatedQR}
              alt="Generated QR"
              className="generated-qr-image"
            />

            <br />

            <a
              href={generatedQR}
              download={`${qrMemberId}.png`}
            >
              <button className="reset-btn">
                Download QR
              </button>
            </a>

          </div>

        )}

      </div>

    </div>

  )

)}


{/* =========================
    ADMIN CONTROL PANEL
========================== */}

  {activeTab === 'Admin' && (

    <>

      <div className="glass panel">

        {!isLeader ? (

          <h3>Access Denied (Leader Only)</h3>

        ) : (

          <>

            <div className="panel-header">

              <div>

                <h3>Admin Control Panel</h3>

                <p className="attendance-count">
                  Total Users: {users.slice(1).length}
                </p>

              </div>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {users.slice(1).map((u, i) => {

                    const id = u[3]

                    return (

                      <tr key={i}>

                        <td>

                          <input
                            type="checkbox"
                            onChange={(e) => {

                              if (e.target.checked) {

                                setSelectedUsers(prev => [
                                  ...prev,
                                  id
                                ])

                              } else {

                                setSelectedUsers(prev =>
                                  prev.filter(x => x !== id)
                                )

                              }

                            }}
                          />

                        </td>

                        <td>{u[0]}</td>
                        <td>{u[1]}</td>
                        <td>{u[2]}</td>
                        <td>{u[4]}</td>

                      </tr>

                    )

                  })}

                </tbody>

              </table>

            </div>

            <br />

            <button
              className="reset-btn"
              onClick={async () => {

                const ids = selectedUsers.join(",")

                const url =
                  `${API_URL}?action=notify&ids=${encodeURIComponent(ids)}`

                try {

  const res = await fetch(url, {
    method: "GET"
  })

  const data = await res.json()

  console.log(data)

  if (data.id || data.recipients > 0) {

    alert("✅ Notification sent!")

  } else {

    alert("❌ Notification failed")

    console.log(data)
  }

} catch (err) {

  console.error(err)

  alert("❌ Failed")

}

              }}
            >
              Send Reminder
            </button>

          </>

        )}

      </div>

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

    <div
      className={`menu-item ${
        active ? 'active' : ''
      }`}
      onClick={onClick}
    >

      {icon}

      <span>{text}</span>

    </div>
  )
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

        <h2>{value}</h2>

      </div>

    </div>
  )
}