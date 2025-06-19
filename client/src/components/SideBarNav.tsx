import './SideBarNav.css';
import { useState } from 'react';
import { NavLink, NavLinkRenderProps } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { username } = useAuth();

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const navClass = ({ isActive }: NavLinkRenderProps) =>
    `menu_button ${isActive ? 'menu_selected' : ''}`;

  return (
    <div className='sideBarNav'>
      <NavLink to='/' className={navClass} data-focus-group='sidebar'>
        Home
      </NavLink>
      <NavLink to='/games' className={navClass} data-focus-group='sidebar'>
        Games
      </NavLink>
      <NavLink to='/leaderboard' className={navClass} data-focus-group='sidebar'>
        Leaderboard
      </NavLink>
      <NavLink to='/forum' className={navClass} data-focus-group='sidebar'>
        Forum
      </NavLink>
      <NavLink
        to={`/profile/${username}`}
        id='menu_user'
        className={navClass}
        onClick={toggleOptions}
        data-focus-group='sidebar'>
        Profile
      </NavLink>
      <NavLink to='/friends' end className={navClass} data-focus-group='sidebar'>
        Friends
      </NavLink>
      <NavLink to='/preferences' className={navClass} data-focus-group='sidebar'>
        Accesibility Preferences
      </NavLink>
    </div>
  );
}
