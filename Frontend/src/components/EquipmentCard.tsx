import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Equipment } from '../data';
import { money } from '../data';
import { Icon, MachineIcon } from './Icons';

export function EquipmentVisual({ item, eager = false }: { item: Equipment; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? <img src={item.image} alt={item.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} className={['Power & generators','Concrete equipment'].includes(item.category) ? 'product-cutout' : ''} /> : <div className="equipment-illustration"><MachineIcon type={item.category} /><span>{item.category}</span></div>;
}
export function EquipmentCard({ item, saved, toggleSave }: { item: Equipment; saved: boolean; toggleSave: () => void; open?: () => void }) {
  return <article className="equipment-card"><div className="equipment-image"><Link className="image-link" to={`/equipment/${item.id}`} aria-label={`View ${item.name}`}><EquipmentVisual item={item} /></Link><span className={`availability ${item.available ? '' : 'availability-muted'}`}><span />{item.available ? 'Available to request' : 'Check availability'}</span><button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={toggleSave} aria-label={`${saved ? 'Unsave' : 'Save'} ${item.name}`} aria-pressed={saved}><Icon name="heart" /></button></div><div className="equipment-info"><div className="equipment-category">{item.category}<span className="sample-label">Sample</span></div><Link className="card-title" to={`/equipment/${item.id}`}><h3>{item.name}</h3></Link><p className="equipment-location"><Icon name="pin" />{item.location}</p><div className="equipment-specs"><span>{item.capacity}</span><span><Icon name={item.operator ? 'user' : 'truck'} />{item.operator ? 'Operator included' : 'Delivery on request'}</span></div><div className="equipment-price"><p><strong>{money(item.rate)}</strong><span> / day</span></p><Link className="card-arrow" to={`/equipment/${item.id}`} aria-label={`View ${item.name} details`}><Icon name="arrow" /></Link></div></div></article>;
}
