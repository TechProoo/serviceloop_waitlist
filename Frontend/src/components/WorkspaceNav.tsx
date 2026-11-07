import { NavLink } from 'react-router-dom';
import { Icon } from './Icons';
import { useMarketplace } from '../state/marketplaceContext';
import './workspace-nav.css';

export default function WorkspaceNav({ active }: { active: 'requests' | 'bookings' | 'listings' }) {
  const { requests, bookings, ownEquipment } = useMarketplace();
  const views = [
    { id: 'bookings', label: 'Bookings', icon: 'calendar', count: bookings.length, to: '/bookings' },
    { id: 'requests', label: 'Quote requests', icon: 'file', count: requests.length, to: '/requests' },
    { id: 'listings', label: 'My equipment', icon: 'grid', count: ownEquipment.length, to: '/requests?tab=listings' },
  ];
  return <nav className="workspace-navigation" aria-label="Workspace views">
    {views.map(view => <NavLink key={view.id} to={view.to} aria-current={active === view.id ? 'page' : false}
      className={active === view.id ? 'selected' : ''} aria-label={`${view.label} (${view.count})`}>
      <Icon name={view.icon} /><span>{view.label}</span><span className="workspace-nav-count">{view.count}</span>
    </NavLink>)}
  </nav>;
}
