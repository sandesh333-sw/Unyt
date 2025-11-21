import { useState } from 'react';
import { listingAPI } from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const ListingCard = ({ listing, onDelete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if current user owns this listing
  const isOwner = user?.id === listing.owner?._id || user?.id === listing.owner?.id;

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle delete listing
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Listing?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await listingAPI.deleteListing(listing._id);
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Listing has been deleted',
          timer: 2000,
          showConfirmButton: false,
        });
        
        // Call parent callback to remove from list
        if (onDelete) {
          onDelete(listing._id);
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error || 'Failed to delete listing',
        });
      }
      setLoading(false);
    }
  };

  // Get badge color based on listing type
  const getBadgeColor = (type) => {
    switch (type) {
      case 'housing':
        return 'primary';
      case 'marketplace':
        return 'success';
      case 'buddy':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="card h-100 shadow-sm hover-card">
      {/* Image */}
      {listing.images && listing.images.length > 0 && (
        <img
          src={listing.images[0].url}
          className="card-img-top"
          alt={listing.title}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      )}

      <div className="card-body">
        {/* Type Badge & Premium Badge */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className={`badge bg-${getBadgeColor(listing.type)}`}>
            {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
          </span>
          {listing.owner?.tier?.plan === 'premium' && (
            <span className="badge bg-warning text-dark">Premium</span>
          )}
        </div>

        {/* Title */}
        <h5 className="card-title">{listing.title}</h5>

        {/* Description */}
        <p className="card-text text-muted">
          {listing.description.length > 100
            ? listing.description.substring(0, 100) + '...'
            : listing.description}
        </p>

        {/* Specific details based on listing type */}
        <div className="mb-3">
          {listing.type === 'housing' && listing.housing && (
            <>
              <p className="mb-1">
                <strong>Price:</strong> £{listing.housing.price}/month
              </p>
              <p className="mb-1">
                <strong>Location:</strong> {listing.housing.location}
              </p>
              {listing.housing.bedrooms && (
                <p className="mb-1">
                  <strong>Bedrooms:</strong> {listing.housing.bedrooms}
                </p>
              )}
            </>
          )}

          {listing.type === 'marketplace' && listing.marketplace && (
            <>
              <p className="mb-1">
                <strong>Price:</strong> £{listing.marketplace.price}
              </p>
              <p className="mb-1">
                <strong>Condition:</strong>{' '}
                {listing.marketplace.condition
                  ? listing.marketplace.condition.charAt(0).toUpperCase() +
                    listing.marketplace.condition.slice(1)
                  : 'N/A'}
              </p>
            </>
          )}

          {listing.type === 'buddy' && listing.buddy && (
            <>
              <p className="mb-1">
                <strong>Type:</strong>{' '}
                {listing.buddy.type
                  ? listing.buddy.type.charAt(0).toUpperCase() +
                    listing.buddy.type.slice(1)
                  : 'N/A'}
              </p>
              {listing.buddy.location && (
                <p className="mb-1">
                  <strong>Location:</strong> {listing.buddy.location}
                </p>
              )}
              {listing.buddy.date && (
                <p className="mb-1">
                  <strong>Date:</strong> {formatDate(listing.buddy.date)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Owner Info */}
        <div className="border-top pt-2 mt-2">
          <small className="text-muted">
            Posted by: {listing.owner?.firstName} {listing.owner?.lastName}
          </small>
          <br />
          <small className="text-muted">
            {formatDate(listing.createdAt)}
          </small>
        </div>
      </div>

      {/* Delete Button (only for owner) */}
      {isOwner && (
        <div className="card-footer bg-transparent">
          <button
            className="btn btn-danger btn-sm w-100"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Deleting...
              </>
            ) : (
              'Delete Listing'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingCard;

