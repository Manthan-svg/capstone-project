import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import CommunicationCore from './pages/CommunicationCore'
import Enrollment from './pages/Enrollment'
import HealthcareUser from './pages/HealthcareUser'
import AppointmentChat from './pages/AppointmentChat'
import Telemedicine from './pages/Telemedicine'

// Layout Components
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'

// New Role-Based Imports
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleProtectedRoute, RoleBasedRedirect } from './components/RoleRoute'
import HospitalDashboard from './pages/HospitalDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import InterpreterDashboard from './pages/InterpreterDashboard'

// Community Module
import CommunityShell from './pages/Community'
import CommunityProfile from './pages/Community/CommunityProfile'
import CommunityForums from './pages/Community/CommunityForums'
import CommunityGroups from './pages/Community/CommunityGroups'
import CommunityMessages from './pages/Community/CommunityMessages'
import CommunityEvents from './pages/Community/CommunityEvents'
import CommunityMentorship from './pages/Community/CommunityMentorship'
import VideoCall from './pages/VideoCall'
import { CallNotifier } from './components/CallNotifier'

// Learning Module
import LearningShell from './pages/Learning'
import CourseCatalog from './pages/Learning/CourseCatalog'
import LessonViewer from './pages/Learning/LessonViewer'
import PracticeFlashcards from './pages/Learning/PracticeFlashcards'
import Certificates from './pages/Learning/Certificates'

// Employment Module
import EmploymentShell from './pages/Employment'
import JobBoard from './pages/Employment/JobBoard'
import MyApplications from './pages/Employment/MyApplications'
import ResumeBuilder from './pages/Employment/ResumeBuilder'
import EmployerDashboard from './pages/EmployerDashboard'

// Government & Accessibility Module
import GovernmentShell from './pages/Government'
import SchemesDirectory from './pages/Government/SchemesDirectory'
import NGODirectory from './pages/Government/NGODirectory'
import DocumentVault from './pages/Government/DocumentVault'
import AIAssistant from './pages/Government/AIAssistant'

function AppShell() {
  const { session, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef(null)

  // Close mobile menu and scroll to top when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0)
    }
  }, [location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-primary font-medium">Loading SignBridge AI...</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="bg-background flex flex-col md:flex-row h-screen md:h-auto md:min-h-screen overflow-hidden md:overflow-visible">
      <CallNotifier />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen z-20 shrink-0">
        <Sidebar className="h-full" />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-fade-in-up" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar className="flex w-[280px]" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full md:h-auto md:min-h-screen overflow-hidden md:overflow-visible relative">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main ref={mainRef} className="flex-1 overflow-y-auto md:overflow-visible bg-background p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function EmptyModule({ title }) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground">This module is not yet implemented.</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AppShell />}>
            {/* Allow all users to access the main Home dashboard. Specialized roles can navigate to their portals via the sidebar. */}
            <Route index element={<Home />} />

            <Route path="core" element={<CommunicationCore />} />
            <Route path="appointment/:id/chat" element={<AppointmentChat />} />
              <Route path="appointment/:id/video" element={<Telemedicine />} />
              <Route path="call/:id" element={<VideoCall />} />
              <Route path="enroll" element={<Enrollment />} />
              <Route path="healthcare" element={<HealthcareUser />} />
              
              {/* Community Routes */}
              <Route path="community" element={<CommunityShell />}>
                <Route index element={<Navigate to="forums" replace />} />
                <Route path="profile" element={<CommunityProfile />} />
                <Route path="forums" element={<CommunityForums />} />
                <Route path="groups" element={<CommunityGroups />} />
                <Route path="messages" element={<CommunityMessages />} />
                <Route path="events" element={<CommunityEvents />} />
                <Route path="mentorship" element={<CommunityMentorship />} />
              </Route>

              {/* Learning Routes */}
              <Route path="learning" element={<LearningShell />}>
                <Route index element={<Navigate to="courses" replace />} />
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="course/:id" element={<LessonViewer />} />
                <Route path="practice" element={<PracticeFlashcards />} />
                <Route path="certificates" element={<Certificates />} />
              </Route>

              {/* Employment Routes */}
              <Route path="jobs" element={<EmploymentShell />}>
                <Route index element={<Navigate to="board" replace />} />
                <Route path="board" element={<JobBoard />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="resume" element={<ResumeBuilder />} />
              </Route>

              {/* Government & Accessibility Routes */}
              <Route path="government" element={<GovernmentShell />}>
                <Route index element={<Navigate to="schemes" replace />} />
                <Route path="schemes" element={<SchemesDirectory />} />
                <Route path="ngos" element={<NGODirectory />} />
                <Route path="vault" element={<DocumentVault />} />
                <Route path="ai" element={<AIAssistant />} />
              </Route>


            {/* Admin Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            
            {/* Employer Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Employer']} />}>
              <Route path="employer" element={<EmployerDashboard />} />
            </Route>
            
            {/* Doctor Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Doctor']} />}>
              <Route path="doctor" element={<DoctorDashboard />} />
            </Route>

            {/* Hospital Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Hospital']} />}>
              <Route path="hospital" element={<HospitalDashboard />} />
            </Route>
            
            {/* Interpreter Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Interpreter']} />}>
              <Route path="interpreter" element={<InterpreterDashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
