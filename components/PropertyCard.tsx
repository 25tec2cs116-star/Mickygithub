
import React from 'react';
import { Property, RentCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface PropertyCardProps {
  property: Property;
  rating?: number;
  onClick: (p: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, rating, onClick }) => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const shareData = {
      title: property.name,
      text: `Check out this ${property.type} at ${property.location.address} for ₹${property.rent}/mo!`,
      url: shareUrl,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {
        prompt('Copy this link to share:', shareUrl);
      });
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const contact = property.contact;
    const isEmail = contact.includes('@');
    
    if (isEmail) {
      window.location.href = `mailto:${contact}?subject=Inquiry regarding ${property.name}`;
    } else {
      // Strip non-digits for tel: protocol
      const phoneDigits = contact.replace(/\D/g, '');
      const confirmCall = window.confirm(`Would you like to contact the owner at ${contact}?`);
      if (confirmCall) {
        window.location.href = `tel:${phoneDigits}`;
      }
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative flex flex-col h-full"
      onClick={() => onClick(property)}
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img 
          src={property.images[0]} 
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[property.category]}`}>
            {property.category}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm border border-white/50 text-slate-800`}>
            {property.type}
          </span>
        </div>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white shadow-sm border border-white/50 transition-all z-10"
          title="Share Property"
        >
          <i className="fa-solid fa-share-nodes text-xs"></i>
        </button>

        {/* Rating Badge */}
        {rating && rating > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm border border-white/50 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
            <i className="fa-solid fa-star text-yellow-500"></i>
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

        {!property.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">Sold Out</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{property.name}</h3>
          <p className="text-blue-600 font-bold">₹{property.rent}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
        </div>
        <div className="flex items-center text-slate-500 text-sm mb-3">
          <i className="fa-solid fa-location-dot mr-1.5 text-blue-400"></i>
          <span className="truncate">{property.location.address}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {property.amenities.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="text-[10px] text-slate-400">+{property.amenities.length - 3} more</span>
          )}
        </div>
        
        {/* Contact Button - Visually Distinct */}
        <button 
          onClick={handleContact}
          className="mt-auto w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          <i className={property.contact.includes('@') ? "fa-solid fa-envelope" : "fa-solid fa-phone"}></i>
          Contact Owner
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;
