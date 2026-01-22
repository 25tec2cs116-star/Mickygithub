
import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import { getPropertyInsights, InsightResult } from '../services/geminiService';
import { CATEGORY_COLORS } from '../constants';

interface PropertyModalProps {
  property: Property;
  currentRating: number;
  onRate: (rating: number) => void;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ property, currentRating, onRate, onClose }) => {
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      const data = await getPropertyInsights(property.name, property.location.address);
      setInsights(data);
      setLoading(false);
    };
    fetchInsights();
  }, [property]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg text-slate-600 hover:text-slate-900 transition-all"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Images */}
          <div className="h-[300px] md:h-full bg-slate-100">
            <div className="grid grid-cols-1 h-full gap-2 p-4">
              {property.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full h-full object-cover rounded-2xl" />
              ))}
              {property.images.length === 1 && (
                <div className="bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                  <i className="fa-regular fa-image text-4xl"></i>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="p-8 md:p-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${CATEGORY_COLORS[property.category]}`}>
                  {property.category}
                </span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {property.type}
                </span>
              </div>
              
              {/* Rating Section */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => onRate(star)}
                      className="transition-transform active:scale-90"
                    >
                      <i className={`fa-solid fa-star text-lg ${
                        (hoverRating || currentRating) >= star 
                          ? 'text-yellow-400' 
                          : 'text-slate-200'
                      }`}></i>
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                  {currentRating > 0 ? 'Your Rating' : 'Rate this stay'}
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{property.name}</h2>
            <p className="text-blue-600 text-2xl font-bold mb-6">₹{property.rent}<span className="text-base text-slate-500 font-normal"> / month</span></p>
            
            <div className="flex items-center text-slate-600 mb-8 pb-8 border-b border-slate-100">
              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                <i className="fa-solid fa-location-dot text-blue-500"></i>
              </div>
              <span className="text-lg">{property.location.address}</span>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h4>
                <p className="text-slate-700 leading-relaxed">{property.description}</p>
              </div>

              {/* AI Insights Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-sparkles text-[10px] text-white"></i>
                  </div>
                  <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Smart Insights</h4>
                </div>
                
                {loading ? (
                  <div className="flex flex-col gap-3 py-4">
                    <div className="flex gap-3 items-center text-indigo-500 text-sm italic">
                      <i className="fa-solid fa-circle-notch fa-spin"></i> 
                      <span>Analyzing neighborhood trends and local spots...</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ) : insights ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Why we love it</label>
                       <p className="text-indigo-900 italic leading-relaxed font-medium">"{insights.pitch}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nearby Landmarks</label>
                        <div className="flex flex-wrap gap-2">
                          {insights.nearbyPoints.map((point, idx) => (
                            <div key={idx} className="bg-white/60 text-indigo-700 text-[11px] px-3 py-1 rounded-full border border-indigo-200/50 shadow-sm">
                              <i className="fa-solid fa-map-pin mr-1 text-indigo-400"></i> {point}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neighborhood Vibe</label>
                        <p className="text-indigo-800 text-xs leading-relaxed">{insights.vibe}</p>
                      </div>
                    </div>

                    {/* Grounding Sources */}
                    {insights.sources.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-indigo-100">
                        <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2">Verified Sources</label>
                        <div className="flex flex-wrap gap-2">
                          {insights.sources.slice(0, 3).map((source, idx) => (
                            <a 
                              key={idx} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-white/40 px-2 py-1 rounded-md transition-colors"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                              <span className="truncate max-w-[120px]">{source.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">Insights currently unavailable. Check back later!</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Amenities</h4>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <i className="fa-solid fa-check-circle text-green-500 mr-2"></i>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    const isEmail = property.contact.includes('@');
                    if (isEmail) {
                      window.location.href = `mailto:${property.contact}?subject=Inquiry: ${property.name}`;
                    } else {
                      window.location.href = `tel:${property.contact.replace(/\D/g, '')}`;
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  <i className={property.contact.includes('@') ? "fa-solid fa-envelope" : "fa-solid fa-phone"}></i>
                  Contact Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyModal;
