import React from 'react';
import { useSelector } from 'react-redux';
import AdminAttendance from '../components/attendance/AdminAttendance';
import EmployeeAttendance from '../components/attendance/EmployeeAttendance';

const Attendance = () => {
  const { user } = useSelector((state) => state.auth);

  return user?.role === 'admin' ? <AdminAttendance /> : <EmployeeAttendance />;
};

export default Attendance; 