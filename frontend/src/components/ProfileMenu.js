import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Dropdown,DropdownToggle,DropdownMenu,DropdownItem,} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { logout } from '../store/authSlice';

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  const phone =
    user.phone || user.phoneNumber || user.mobile || 'Phone not provided';

  const handleLogout = () => {
  dispatch(logout());
  setOpen(false);
  navigate("/", { replace: true });
};


  return (
    <Dropdown isOpen={open} toggle={toggle}>
      <DropdownToggle
        caret
        color="light"
        className="border-0 d-flex align-items-center gap-2"
      >
        <FaUserCircle size={24} />
        <span className="d-none d-sm-inline">
          {user.name || user.fullName || 'Profile'}
        </span>
      </DropdownToggle>
      <DropdownMenu end>
        <div className="px-3 py-2 small">
          <div className="fw-semibold">{user.name || 'User'}</div>
          {user.email && <div className="text-muted">{user.email}</div>}
          <div className="text-muted">{phone}</div>
        </div>
        <DropdownItem divider />
        <DropdownItem
          onClick={() => {
            navigate('/resetpass');
            setOpen(false);
          }}
        >
          Reset Password
        </DropdownItem>
        <DropdownItem divider />
        <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default ProfileMenu;
