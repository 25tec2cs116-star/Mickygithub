
export enum PropertyType {
  PG = 'PG',
  HOSTEL = 'Hostel',
  APARTMENT = 'Apartment',
  ROOM = 'Single Room'
}

export enum RentCategory {
  BUDGET = 'Budget',
  MID_RANGE = 'Mid-Range',
  LUXURY = 'Luxury'
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  rent: number;
  category: RentCategory;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  amenities: string[];
  images: string[];
  description: string;
  available: boolean;
  contact: string;
  createdAt: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}
