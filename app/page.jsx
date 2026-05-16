'use client'

import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'

import {
  Home,
  Calendar,
  Users,
  ClipboardList,
  Search,
  Menu,
} from 'lucide-react'

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
  'https://script.google.com/macros/s/AKfycbxKpZdL1wzbjmtTGAprLywJ6pgLX0B-M6FSNw90hSK0el6-v0dsZ0hNSo8lf5SHfG-g/exec'

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

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [installPrompt, setInstallPrompt] =
  useState(null)

  const [attendance, setAttendance] = useState([])
  const [events, setEvents] = useState([])
  const [leaders, setLeaders] = useState([])
  const [followup, setFollowup] = useState([])
  const [finance, setFinance] = useState([])
  const [youthGetLoud, setYouthGetLoud] = useState([])
  const [yglParticipants, setYglParticipants] =
  useState([])

const [selectedEventParticipants,
  setSelectedEventParticipants] =
  useState(null)

  const [activeTab, setActiveTab] = useState('Homepage')

  const [selectedLeader, setSelectedLeader] =
    useState(null)

  const [search, setSearch] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [users, setUsers] = useState([])
const [selectedUsers, setSelectedUsers] = useState([])
const [isLeader, setIsLeader] = useState(false)

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchData()
  }, [])

useEffect(() => {
  if (!users.length) return

  const roleColumnIndex = 2 // Role column

  const hasLeader = users
    .slice(1)
    .some(u =>
      (u[roleColumnIndex] || "")
        .toString()
        .trim()
        .toLowerCase() === "leader"
    )

  setIsLeader(hasLeader)
}, [users])

useEffect(() => {

  async function setupUser() {

    if (!window.OneSignal) return

    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches

    if (!isInstalled) return

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

      const res = await axios.get(API_URL)

      setAttendance(res.data.attendance || [])
      setEvents(res.data.events || [])
      setLeaders(res.data.leaders || [])
      setFollowup(res.data.followup || [])
      setFinance(res.data.finance || [])
      setUsers(res.data.users || [])
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
    icon: <Home size={18} />,
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
  {
    name: 'FollowUp',
    icon: <Users size={18} />,
  },
  {
    name: 'Finance',
    icon: <ClipboardList size={18} />,
  },
  {
    name: 'Admin',
    icon: <Users size={18} />,
  }
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

          <div className="glass panel">

            <div className="panel-header">

              <h3>Events</h3>

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

            <div className="events-grid">

              {searchedEvents.map((e, i) => {

                const eventAttendance =
                  attendance
                    .slice(1)
                    .filter((a) => {

                      const attendanceDate =
                        formatDate(a[0])

                      const eventDate =
                        formatDate(e[0])

                      return (
                        attendanceDate ===
                        eventDate
                      )
                    })

                let totalParticipants = 0
let totalFirstTimers = 0

if (
  e[1]
    ?.toString()
    .toLowerCase()
    .includes('youth-get-loud')
) {

  const yglData =
    youthGetLoud.slice(1)

  totalParticipants =
    yglData.length

  totalFirstTimers =
    yglData.filter(
      (p) =>
        p[5]
          ?.toString()
          .toLowerCase() === 'yes'
    ).length

} else {

  const eventAttendance =
    attendance
      .slice(1)
      .filter((a) => {

        const attendanceDate =
          formatDate(a[0])

        const eventDate =
          formatDate(e[0])

        return (
          attendanceDate ===
          eventDate
        )
      })

  totalParticipants =
    eventAttendance.length

  totalFirstTimers =
    eventAttendance.filter(
      (a) =>
        a[5]
          ?.toString()
          .toLowerCase() ===
        'yes'
    ).length
}

                return (

                  <div
                  className="event-card clickable"
                  key={i}
                  onClick={() => {

                    if (
                      e[1]
                        ?.toLowerCase()
                        .includes('youth-get-loud')
                    ) {

                      setSelectedEventParticipants({

                        title: e[1],

                        participants:
                          yglParticipants.slice(1),

                      })
                    }

                  }}
                >

                    <div className="event-top">

                      <div>

                        <h2>{e[1]}</h2>

                        <div className="event-info">

                          <p>
                            📅{' '}
                            {displayDate(e[0])}
                          </p>

                          <p>
                            📍 {e[2]}
                          </p>

                          <p>
                            ⏰{' '}
                            {displayTime(e[3])}
                          </p>

                        </div>

                        <span className="status-badge">
                          {e[4]}
                        </span>

                      </div>

                      <div className="event-stats">

                        <div className="event-stat-box blue-stat">

                          <span>
                            Participants
                          </span>

                          <h3>
                            {
                              totalParticipants
                            }
                          </h3>

                        </div>

                        <div className="event-stat-box">

                          <span>
                            First Timers
                          </span>

                          <h3>
                            {
                              totalFirstTimers
                            }
                          </h3>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              })}

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
                    ?.split(',')
                    .map((member) =>
                      member.trim()
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
                        👥 {members.length}{' '}
                        Members
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
                  {selectedLeader.name}
                  's LifeGroup
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

        const memberName =
  member.trim().toLowerCase()

        const leaderData =
          leaders.find(
            (l) =>
              l[1] ===
              selectedLeader.name
          )

          const cleanArray = (value) =>
  value
    ?.split(',')
    .map((m) =>
      m.trim().toLowerCase()
    )
    .filter(Boolean) || []

const closecell =
  cleanArray(leaderData?.[5])

const suynl =
  cleanArray(leaderData?.[6])

const lifeclass =
  cleanArray(leaderData?.[7])

const sol1 =
  cleanArray(leaderData?.[8])

const sol2 =
  cleanArray(leaderData?.[9])

const sol3 =
  cleanArray(leaderData?.[10])

        return (

          <div
            className="popup-member-card"
            key={index}
          >

            <div className="popup-member-top">

              <span>
                {index + 1}.
              </span>

              <h4>{member}</h4>

            </div>

            <div className="disciple-grid">

              {closecell.includes(memberName) && (
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

        {/* EVENT PARTICIPANTS POPUP */}
{selectedEventParticipants && (

  <div
    className="leader-popup-overlay"
    onClick={() =>
      setSelectedEventParticipants(null)
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
          {selectedEventParticipants.title}
          {' '}Participants
        </h2>

        <button
          className="popup-close"
          onClick={() =>
            setSelectedEventParticipants(null)
          }
        >
          ✕
        </button>

      </div>

      <div className="popup-members">

        {selectedEventParticipants
          .participants.length > 0 ? (

          selectedEventParticipants
            .participants.map((p, i) => (

            <div
              className="popup-member-card"
              key={i}
            >

              <div className="popup-member-top">

                <span>
                  {i + 1}.
                </span>

                <h4>{p[1]}</h4>

              </div>

              <div className="followup-body">

                <p>
                  🎂 Age: {p[2]}
                </p>

                <p>
                  🙋 Invited By:
                  {' '}
                  {p[3]}
                </p>

                <p>
                  🏫 School:
                  {' '}
                  {p[4]}
                </p>

                <p>
                  ✨ First Timer:
                  {' '}
                  {p[5]}
                </p>

                <p>
                  📜 Reminder Agreement:
                  {' '}
                  {p[6]}
                </p>

              </div>

            </div>

          ))

        ) : (

          <p>No participants found.</p>

        )}

      </div>

    </div>

  </div>

)}

        {/* FOLLOWUP */}
        {activeTab === 'FollowUp' && (

          <div className="glass panel">

            <div className="panel-header">

              <div>

                <h3>Follow Up Tracker</h3>

                <p className="attendance-count">

                  Total Follow Ups:{' '}
                  {followup.slice(1).length}

                </p>

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

                ))}

            </div>

          </div>

        )}

  {/* FINANCE */}
{activeTab === 'Finance' && (
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
)}

{activeTab === 'Admin' && (
  <div className="glass panel">

    {!isLeader ? (
      <h3>Access Denied (Leader Only)</h3>
    ) : (
      <>
        <h3>Send Notification Panel</h3>

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
                            setSelectedUsers(prev => [...prev, id])
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

    const url = `${API_URL}?action=notify&ids=${encodeURIComponent(ids)}`

    try {
      await fetch(url, {
        method: "GET",
        mode: "no-cors"
      })

      alert("Notification sent!")
    } catch (err) {
      console.error(err)
      alert("Failed")
    }
  }}
>
  Send Reminder
</button>

      </>
    )}

  </div>
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