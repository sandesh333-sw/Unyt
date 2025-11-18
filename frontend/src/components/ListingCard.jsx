export default function ListingCard({ listing }) {
  const getBadgeColor = (type) => {
    switch(type) {
      case 'housing': return 'bg-primary';
      case 'marketplace': return 'bg-success';
      case 'buddy': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer' }}>
      {listing.images?.[0] ? (
        <img 
          src={listing.images[0].url} 
          className="card-img-top" 
          alt={listing.title}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      ) : (
        <div 
          className="card-img-top bg-light d-flex align-items-center justify-content-center"
          style={{ height: '200px' }}
        >
          <span className="text-muted">No Image</span>
        </div>
      )}
      
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{listing.title}</h5>
          <span className={`badge ${getBadgeColor(listing.type)}`}>
            {listing.type}
          </span>
        </div>
        
        <p className="card-text text-muted small">
          {listing.description?.slice(0, 100)}
          {listing.description?.length > 100 ? '...' : ''}
        </p>
        
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">
            {listing.owner?.firstName} {listing.owner?.lastName}
          </small>
          
          {/* Show price if available */}
          {(listing.housing?.price || listing.marketplace?.price) && (
            <span className="fw-bold text-primary">
              £{listing.housing?.price || listing.marketplace?.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
