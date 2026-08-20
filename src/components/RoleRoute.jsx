import { useEffect } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RoleProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login')
      } else if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        // Redirect to their respective home if they try to access an unauthorized route
        switch (profile.role) {
          case 'Admin': navigate('/admin'); break;
          case 'Doctor': navigate('/doctor'); break;
          case 'Hospital': navigate('/hospital'); break;
          case 'Interpreter': navigate('/interpreter'); break;
          default: navigate('/'); break;
        }
      }
    }
  }, [user, profile, loading, navigate, allowedRoles, location.pathname])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!user || (profile && allowedRoles && !allowedRoles.includes(profile.role))) {
    return null
  }

  return <Outlet />
}

export function RoleBasedRedirect() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && user && profile && location.pathname === '/') {
      if (profile.role === 'Admin') navigate('/admin')
      else if (profile.role === 'Doctor') navigate('/doctor')
      else if (profile.role === 'Hospital') navigate('/hospital')
      else if (profile.role === 'Employer') navigate('/employer')
      else if (profile.role === 'Interpreter') navigate('/interpreter')
      // Removed the forced redirect to '/core'. Standard users should remain on '/' (Home dashboard).
    }
  }, [user, profile, loading, navigate, location.pathname])

  return <Outlet />
}
