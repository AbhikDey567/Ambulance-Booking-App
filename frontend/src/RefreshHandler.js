import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function RefreshHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // no token, do nothing

      try {
        const res = await fetch('http://localhost:8080/api/stay', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          // Redirect away from login/signup if authenticated
          if (
            ['/login', '/signup', '/user-login', '/user-signup'].includes(location.pathname)
          ) {
            navigate('/', { replace: true });
          }
        } else {
          // Token invalid or expired, remove it
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  return null;
}

export default RefreshHandler;
