
import { Property, PropertyType, RentCategory } from './types';

export const ALL_AMENITIES = [
  'WiFi', '3 Meals', 'Laundry', 'Attached Bathroom', 'Gym', 'Pool', 'Parking', '24/7 Security', 'AC', 'Elevator', 'Kitchen'
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Green View PG for Gents',
    type: PropertyType.PG,
    rent: 8500,
    category: RentCategory.BUDGET,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'Indiranagar, Bangalore'
    },
    amenities: ['WiFi', '3 Meals', 'Laundry', 'Attached Bathroom'],
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800'],
    description: 'A cozy PG located in the heart of the city with all modern amenities.',
    available: true,
    contact: '+91 98765 43210',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 // 2 days ago
  },
  {
    id: '2',
    name: 'Skyline Luxury Apartments',
    type: PropertyType.APARTMENT,
    rent: 25000,
    category: RentCategory.LUXURY,
    bedrooms: 2,
    bathrooms: 2,
    location: {
      lat: 12.9279,
      lng: 77.6271,
      address: 'Koramangala, Bangalore'
    },
    amenities: ['Gym', 'Pool', 'Parking', '24/7 Security', 'WiFi', 'AC'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800'],
    description: 'Modern 2BHK apartment with breathtaking views and premium facilities.',
    available: true,
    contact: '+91 99887 76655',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
  },
  {
    id: '3',
    name: 'St. Jude\'s Hostel',
    type: PropertyType.HOSTEL,
    rent: 6000,
    category: RentCategory.BUDGET,
    bedrooms: 1,
    bathrooms: 4,
    location: {
      lat: 12.9345,
      lng: 77.6101,
      address: 'HSR Layout, Bangalore'
    },
    amenities: ['Common Room', 'Library', 'Canteen', 'WiFi'],
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800'],
    description: 'Affordable and safe hostel for students with a focus on community living.',
    available: false,
    contact: '+91 91234 56789',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1 // 1 day ago
  }
];

export const CATEGORY_COLORS = {
  [RentCategory.BUDGET]: 'bg-green-100 text-green-800 border-green-200',
  [RentCategory.MID_RANGE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [RentCategory.LUXURY]: 'bg-purple-100 text-purple-800 border-purple-200',
};
