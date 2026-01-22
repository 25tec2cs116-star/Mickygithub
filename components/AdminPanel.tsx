
import React, { useState } from 'react';
import { Property, PropertyType, RentCategory } from '../types';

interface AdminPanelProps {
  onAddProperty: (p: Property) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddProperty, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: PropertyType.PG,
    rent: '',
    bedrooms: '',
    bathrooms: '',
    address: '',
    description: '',
    amenities: '',
    imageUrl: '',
    available: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let category = RentCategory.MID_RANGE;
    const rentVal = parseInt(formData.rent);
    if (rentVal < 10000) category = RentCategory.BUDGET;
    else if (rentVal > 20000) category = RentCategory.LUXURY;

    const newProperty: Property = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      type: formData.type,
      rent: rentVal,
      category,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      location: {
        lat: 12.9716 + (Math.random() - 0.5) * 0.05, // Slight randomization for demo map variety
        lng: 77.5946 + (Math.random() - 0.5) * 0.05,
        address: formData.address
      },
      amenities: formData.amenities.split(',').map(s => s.trim()).filter(s => s),
      images: [formData.imageUrl || 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&q=80&w=800'],
      description: formData.description,
      available: formData.available,
      contact: '+91 00000 00000',
      createdAt: Date.now()
    };

    onAddProperty(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-800">Register Property</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Property Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Sunny PG"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
              >
                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Rent (₹)</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="5000"
                value={formData.rent}
                onChange={e => setFormData({...formData, rent: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bedrooms</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="1"
                value={formData.bedrooms}
                onChange={e => setFormData({...formData, bedrooms: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bathrooms</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="1"
                value={formData.bathrooms}
                onChange={e => setFormData({...formData, bathrooms: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Area, City"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Available for Rent</h4>
              <p className="text-xs text-slate-500 mt-1">If unchecked, property will show as "Sold Out"</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, available: !formData.available})}
              className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${formData.available ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${formData.available ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-32 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              placeholder="Tell us about the property features, policies, etc..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Amenities (comma separated)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="WiFi, 3 Meals, AC, Laundry..."
              value={formData.amenities}
              onChange={e => setFormData({...formData, amenities: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Image URL</label>
            <input 
              type="url" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
            >
              Register Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
