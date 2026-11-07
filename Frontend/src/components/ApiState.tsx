import { useMarketplace } from '../state/marketplaceContext';
export function CatalogState() {
  const { catalogLoading, catalogError, reloadCatalog } = useMarketplace();
  if (catalogLoading) return <div className="api-state" role="status">Loading equipment…</div>;
  if (catalogError) return <div className="api-state" role="alert"><p>{catalogError}</p><button className="button button-outline" onClick={() => void reloadCatalog()}>Try again</button></div>;
  return null;
}
export function WorkspaceState() {
  const { workspaceLoading, workspaceError, reloadWorkspace } = useMarketplace();
  if (workspaceLoading) return <div className="api-state" role="status">Loading your workspace…</div>;
  if (workspaceError) return <div className="api-state" role="alert"><p>{workspaceError}</p><button className="button button-outline" onClick={() => void reloadWorkspace()}>Try again</button></div>;
  return null;
}
