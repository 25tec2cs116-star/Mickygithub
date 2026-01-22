
import React, { useState, useEffect, useMemo } from 'react';
import { Property, PropertyType, RentCategory, UserLocation } from './types';
import { INITIAL_PROPERTIES, ALL_AMENITIES } from './constants';
import PropertyCard from './components/PropertyCard';
import PropertyModal from './components/PropertyModal';
import AdminPanel from './components/AdminPanel';
import MapView from './components/MapView';
import { searchPropertiesSmart } from './services/geminiService';

type SortOption = 'rent_asc' | 'rent_desc' | 'name_asc' | 'date_desc';

// Helper to calculate distance in KM using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Ratings state
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('staymate_ratings');
    return saved ? JSON.parse(saved) : {};
  });

  // Basic Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PropertyType | 'All'>('All');
  const [activeCategory, setActiveCategory] = useState<RentCategory | 'All'>('All');
  
  // Advanced Filters
  const [minBedrooms, setMinBedrooms] = useState<number | 'Any'>('Any');
  const [minBathrooms, setMinBathrooms] = useState<number | 'Any'>('Any');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRent, setMinRent] = useState(0);
  const [maxRent, setMaxRent] = useState(50000);
  const [onlyThreeMeals, setOnlyThreeMeals] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10); // Search radius in KM
  
  // Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Check for propertyId in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('propertyId');
    if (propertyId) {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setSelectedProperty(property);
      }
    }
  }, [properties]);

  // Persist ratings
  useEffect(() => {
    localStorage.setItem('staymate_ratings', JSON.stringify(ratings));
  }, [ratings]);

  const handleRate = (propertyId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [propertyId]: rating }));
  };

  const handleGetLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      return;
    }

    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
          // Auto switch to map when location is found
          setViewMode('map');
        },
        () => {
          alert("Location access denied. Please enable location permissions.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredProperties = useMemo(() => {
    const filtered = properties.filter(p => {
      // 1. Proximity Filter (if user location is active)
      if (userLocation) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, p.location.lat, p.location.lng);
        if (dist > searchRadius) return false;
      }

      // 2. Search query filter
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 3. Category & Type filters
      const matchesFilter = activeFilter === 'All' || p.type === activeFilter;
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesRentRange = p.rent >= minRent && p.rent <= maxRent;
      
      // 4. Layout filters
      const matchesBedrooms = minBedrooms === 'Any' || (p.bedrooms !== undefined && p.bedrooms >= Number(minBedrooms));
      const matchesBathrooms = minBathrooms === 'Any' || (p.bathrooms !== undefined && p.bathrooms >= Number(minBathrooms));
      
      // 5. Amenity filters
      const matchesThreeMeals = !onlyThreeMeals || p.amenities.includes('3 Meals');
      const matchesAmenities = selectedAmenities.length === 0 || 
                             selectedAmenities.every(a => p.amenities.includes(a));
      
      return matchesSearch && matchesFilter && matchesCategory && matchesRentRange && matchesBedrooms && matchesBathrooms && matchesThreeMeals && matchesAmenities;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rent_asc': return a.rent - b.rent;
        case 'rent_desc': return b.rent - a.rent;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'date_desc': return b.createdAt - a.createdAt;
        default: return 0;
      }
    });
  }, [properties, searchQuery, activeFilter, activeCategory, minBedrooms, minBathrooms, selectedAmenities, sortBy, minRent, maxRent, onlyThreeMeals, userLocation, searchRadius]);

  const handleDownload = () => {
    if (filteredProperties.length === 0) {
      alert("No properties to download.");
      return;
    }

    const headers = ['Name', 'Type', 'Rent (INR)', 'Category', 'Address', 'Amenities', 'Availability'];
    const rows = filteredProperties.map(p => [
      p.name,
      p.type,
      p.rent,
      p.category,
      `"${p.location.address}"`,
      `"${p.amenities.join(', ')}"`,
      p.available ? 'Available' : 'Occupied'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staymate_search_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const criteria = await searchPropertiesSmart(searchQuery);
    if (criteria) {
      if (criteria.type) {
        const matched = Object.values(PropertyType).find(t => 
          t.toLowerCase().includes(criteria.type.toLowerCase())
        );
        if (matched) setActiveFilter(matched);
      }
      if (criteria.maxBudget) {
        setMaxRent(criteria.maxBudget);
      }
    }
  };

  const addProperty = (newProp: Property) => {
    setProperties(prev => [newProp, ...prev]);
  };

  const activeFiltersCount = (minBedrooms !== 'Any' ? 1 : 0) + 
                            (minBathrooms !== 'Any' ? 1 : 0) + 
                            (minRent > 0 || maxRent < 50000 ? 1 : 0) +
                            (onlyThreeMeals ? 1 : 0) +
                            (searchRadius !== 10 ? 1 : 0) +
                            selectedAmenities.length;

  const getSortLabel = (opt: SortOption) => {
    switch(opt) {
      case 'rent_asc': return 'Price: Low to High';
      case 'rent_desc': return 'Price: High to Low';
      case 'name_asc': return 'Name: A-Z';
      case 'date_desc': return 'Newest First';
    }
  };

  const handleCategoryClick = (cat: RentCategory | 'All') => {
    setActiveCategory(cat);
    // Automatically adjust range based on category for better UX
    if (cat === RentCategory.BUDGET) {
      setMinRent(0);
      setMaxRent(10000);
    } else if (cat === RentCategory.MID_RANGE) {
      setMinRent(10000);
      setMaxRent(20000);
    } else if (cat === RentCategory.LUXURY) {
      setMinRent(20000);
      setMaxRent(50000);
    } else {
      setMinRent(0);
      setMaxRent(50000);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-10">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fa-solid fa-house-chimney-window text-xl"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stay<span className="text-blue-600">Mate</span></h1>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSmartSearch} className="w-full relative group">
              <input 
                type="text" 
                placeholder="Try 'Budget PG in Indiranagar'..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fa-solid fa-grip mr-1.5"></i> Grid
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fa-solid fa-map mr-1.5"></i> Map
              </button>
            </div>
            
            <button 
              onClick={handleDownload}
              title="Download Search Results"
              className="hidden lg:flex px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors items-center gap-2"
            >
              <i className="fa-solid fa-file-export"></i>
              Export
            </button>

            <button 
              onClick={() => setIsAdminOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> List
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Basic Filters & Search Bar Toggle for Mobile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
            {['All', ...Object.values(PropertyType)].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  activeFilter === filter 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex gap-2 relative">
            {/* Sort Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold transition-all hover:bg-slate-50 ${isSortOpen ? 'ring-2 ring-blue-500' : ''}`}
              >
                <i className="fa-solid fa-arrow-up-wide-short text-blue-500"></i>
                <span className="hidden sm:inline">{getSortLabel(sortBy)}</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isSortOpen ? 'rotate-180' : ''}`}></i>
              </button>
              
              {isSortOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {(['date_desc', 'rent_asc', 'rent_desc', 'name_asc'] as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 ${
                        sortBy === opt ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                      }`}
                    >
                      {getSortLabel(opt)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${
                showAdvancedFilters || activeFiltersCount > 0 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-sliders"></i>
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleGetLocation}
              disabled={isLocating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                userLocation 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <i className={`fa-solid fa-location-crosshairs ${isLocating ? 'fa-spin text-blue-500' : ''}`}></i>
              {userLocation ? 'Reset Dist.' : 'Near Me'}
            </button>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {showAdvancedFilters && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Layout & Distance Section */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Layout & Options</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-2">Min Bedrooms</label>
                      <div className="flex gap-2">
                        {['Any', 1, 2, 3].map(val => (
                          <button
                            key={val}
                            onClick={() => setMinBedrooms(val as any)}
                            className={`w-10 h-10 rounded-lg border text-xs font-bold transition-all ${
                              minBedrooms === val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {val === 'Any' ? 'All' : val + '+'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-2">Min Bathrooms</label>
                      <div className="flex gap-2">
                        {['Any', 1, 2, 3].map(val => (
                          <button
                            key={val}
                            onClick={() => setMinBathrooms(val as any)}
                            className={`w-10 h-10 rounded-lg border text-xs font-bold transition-all ${
                              minBathrooms === val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {val === 'Any' ? 'All' : val + '+'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Special Toggle for 3 Meals */}
                    <div className="pt-2">
                      <button 
                        onClick={() => setOnlyThreeMeals(!onlyThreeMeals)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          onlyThreeMeals 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${onlyThreeMeals ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <i className="fa-solid fa-utensils text-xs"></i>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">Includes 3 Meals</p>
                            <p className="text-[9px] opacity-70">Recommended for PG & Hostels</p>
                          </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${onlyThreeMeals ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${onlyThreeMeals ? 'left-6' : 'left-1'}`}></div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Distance Radius Adjustment */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search Distance</h4>
                    <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-lg">{searchRadius} km</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">1km</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">50km</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">Adjust radius for 'Near Me' feature.</p>
                </div>
              </div>

              {/* Budget Section with Slider */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Budget</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex overflow-x-auto gap-2 no-scrollbar">
                    {['All', RentCategory.BUDGET, RentCategory.MID_RANGE, RentCategory.LUXURY].map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat as any)}
                        className={`text-center px-4 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                          activeCategory === cat ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        {cat === 'All' ? 'Any' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Range Slider UI */}
                  <div className="space-y-6 pt-2">
                    <div className="flex justify-between items-center px-1">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Min</span>
                        <div className="text-sm font-bold text-slate-700">₹{minRent}</div>
                      </div>
                      <div className="h-[2px] w-8 bg-slate-200"></div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Max</span>
                        <div className="text-sm font-bold text-slate-700">₹{maxRent === 50000 ? '50k+' : maxRent}</div>
                      </div>
                    </div>

                    <div className="relative h-2 bg-slate-100 rounded-full">
                      <div 
                        className="absolute h-full bg-blue-500 rounded-full"
                        style={{
                          left: `${(minRent / 50000) * 100}%`,
                          right: `${100 - (maxRent / 50000) * 100}%`
                        }}
                      />
                      <input 
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={minRent}
                        onChange={(e) => setMinRent(Math.min(parseInt(e.target.value), maxRent - 500))}
                        className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                      />
                      <input 
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={maxRent}
                        onChange={(e) => setMaxRent(Math.max(parseInt(e.target.value), minRent + 500))}
                        className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Other Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITIES.filter(a => a !== '3 Meals').slice(0, 12).map(amenity => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setMinBedrooms('Any');
                  setMinBathrooms('Any');
                  setSelectedAmenities([]);
                  setActiveCategory('All');
                  setActiveFilter('All');
                  setMinRent(0);
                  setMaxRent(50000);
                  setOnlyThreeMeals(false);
                  setUserLocation(null);
                  setSearchRadius(10);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Clear All
              </button>
              <button 
                onClick={() => setShowAdvancedFilters(false)}
                className="bg-slate-900 text-white px-8 py-2 rounded-xl text-sm font-bold"
              >
                View Results
              </button>
            </div>
          </div>
        )}

        {/* View Content: Grid vs Map */}
        {viewMode === 'grid' ? (
          filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProperties.map(property => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  rating={ratings[property.id]}
                  onClick={setSelectedProperty} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-house-circle-exclamation text-4xl text-slate-300"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No properties found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
              {userLocation && (
                <button 
                  onClick={() => setUserLocation(null)}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Clear 'Near Me' filter
                </button>
              )}
            </div>
          )
        ) : (
          <div className="h-[calc(100vh-280px)] min-h-[500px]">
            <MapView 
              properties={filteredProperties} 
              onPropertyClick={setSelectedProperty}
              center={userLocation || undefined}
            />
          </div>
        )}

        {userLocation && (
          <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 bg-white shadow-2xl rounded-2xl border border-blue-100 p-4 animate-bounce-short z-30">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-xl">
                <i className="fa-solid fa-map-location-dot text-blue-600 text-lg"></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Near You ({searchRadius}km)</h4>
                <p className="text-xs text-slate-500 mt-1">Showing {filteredProperties.length} stay(s) close to your location.</p>
              </div>
              <button onClick={() => setUserLocation(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedProperty && (
        <PropertyModal 
          property={selectedProperty} 
          currentRating={ratings[selectedProperty.id] || 0}
          onRate={(rating) => handleRate(selectedProperty.id, rating)}
          onClose={() => setSelectedProperty(null)} 
        />
      )}
      
      {isAdminOpen && (
        <AdminPanel 
          onAddProperty={addProperty} 
          onClose={() => setIsAdminOpen(false)} 
        />
      )}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 h-16 flex items-center justify-between z-50">
        <button 
          onClick={() => setViewMode('grid')}
          className={`flex flex-col items-center gap-1 ${viewMode === 'grid' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-house"></i>
          <span className="text-[10px] font-bold">Explore</span>
        </button>
        <button 
          onClick={() => setViewMode('map')}
          className={`flex flex-col items-center gap-1 ${viewMode === 'map' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-map"></i>
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button onClick={handleDownload} className="flex flex-col items-center gap-1 text-slate-400">
          <i className="fa-solid fa-file-export"></i>
          <span className="text-[10px] font-bold">Export</span>
        </button>
        <button onClick={() => setIsAdminOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
          <i className="fa-solid fa-circle-plus"></i>
          <span className="text-[10px] font-bold">List</span>
        </button>
      </nav>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short { animation: bounce-short 3s infinite ease-in-out; }
        
        /* Range slider styling */
        input[type='range']::-webkit-slider-thumb {
          pointer-events: all;
          width: 20px;
          height: 20px;
          -webkit-appearance: none;
          background-color: white;
          border: 2px solid #2563eb;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default App;
