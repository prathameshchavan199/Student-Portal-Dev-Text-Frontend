import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import { AuthContext } from './AuthContext.jsx';

const CourseContext = createContext(null);

export function CourseProvider({ children }) {
  const { authenticated } = useContext(AuthContext);
  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/courses`)
      .then((res) => {
        const { courseTypes, courses } = res.data.data;
        setCourseTypes(courseTypes);
        setCourses(courses);
      })
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setLoading(false));
  }, [authenticated]);

  const getCourseById = (id) => courses.find((c) => c.id === id);

  return (
    <CourseContext.Provider value={{ courseTypes, courses, getCourseById, loading }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  return useContext(CourseContext);
}
