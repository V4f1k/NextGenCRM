"""
Google Maps Places API integration for business discovery
Replaces N8N Maps Service functionality
"""

import logging
import requests
import time
from typing import List, Dict, Optional, Tuple
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class GoogleMapsService:
    """Google Maps Places API service for business discovery"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
        self.base_url = "https://maps.googleapis.com/maps/api"
        
        if not self.api_key:
            logger.warning("Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in settings.")
    
    def search_businesses(self, 
                         keyword: str, 
                         location: str, 
                         radius: int = 5000,
                         business_type: str = None,
                         max_results: int = 20) -> List[Dict]:
        """
        Search for businesses using Google Places API
        
        Args:
            keyword: Business type or keyword (e.g., "restaurace", "autoservisy")
            location: City or address (e.g., "Praha", "Brno")
            radius: Search radius in meters (default 5000m)
            business_type: Google Places type filter (optional)
            max_results: Maximum number of results to return
            
        Returns:
            List of business dictionaries with standardized fields
        """
        if not self.api_key:
            logger.error("Google Maps API key not configured")
            return []
        
        # Cache key for this search
        cache_key = f"maps_search_{keyword}_{location}_{radius}_{business_type}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached results for search: {keyword} in {location}")
            return cached_result
        
        try:
            # First, geocode the location to get coordinates
            lat, lng = self._geocode_location(location)
            if not lat or not lng:
                logger.error(f"Could not geocode location: {location}")
                return []
            
            # Search for businesses
            businesses = []
            next_page_token = None
            
            while len(businesses) < max_results:
                # Build search query
                query = f"{keyword} near {location}"
                
                params = {
                    'key': self.api_key,
                    'query': query,
                    'location': f"{lat},{lng}",
                    'radius': radius,
                    'fields': 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,business_status,website,formatted_phone_number'
                }
                
                if business_type:
                    params['type'] = business_type
                    
                if next_page_token:
                    params['pagetoken'] = next_page_token
                
                # Make API request
                response = requests.get(
                    f"{self.base_url}/place/textsearch/json",
                    params=params,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"Google Maps API error: {response.status_code} - {response.text}")
                    break
                
                data = response.json()
                
                if data.get('status') != 'OK':
                    logger.error(f"Google Maps API status: {data.get('status')} - {data.get('error_message', '')}")
                    break
                
                # Process results
                for place in data.get('results', []):
                    if len(businesses) >= max_results:
                        break
                        
                    business = self._process_place_result(place)
                    if business:
                        businesses.append(business)
                
                # Check for next page
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                    
                # Google requires a short delay before using next_page_token
                time.sleep(2)
            
            # Cache results for 1 hour
            cache.set(cache_key, businesses, 3600)
            
            logger.info(f"Found {len(businesses)} businesses for '{keyword}' in '{location}'")
            return businesses
            
        except Exception as e:
            logger.error(f"Error searching businesses: {str(e)}")
            return []
    
    def get_business_details(self, place_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific business
        
        Args:
            place_id: Google Places ID
            
        Returns:
            Dictionary with detailed business information
        """
        if not self.api_key:
            logger.error("Google Maps API key not configured")
            return None
        
        # Cache key for this place
        cache_key = f"place_details_{place_id}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        try:
            params = {
                'key': self.api_key,
                'place_id': place_id,
                'fields': 'name,formatted_address,international_phone_number,website,url,business_status,opening_hours,rating,user_ratings_total,reviews,types,geometry,vicinity,adr_address'
            }
            
            response = requests.get(
                f"{self.base_url}/place/details/json",
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Google Places Details API error: {response.status_code}")
                return None
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.error(f"Google Places Details API status: {data.get('status')}")
                return None
            
            result = data.get('result', {})
            business_details = self._process_place_details(result)
            
            # Cache for 24 hours
            cache.set(cache_key, business_details, 86400)
            
            return business_details
            
        except Exception as e:
            logger.error(f"Error getting business details: {str(e)}")
            return None
    
    def _geocode_location(self, location: str) -> Tuple[Optional[float], Optional[float]]:
        """Geocode a location string to lat/lng coordinates"""
        cache_key = f"geocode_{location}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        try:
            params = {
                'key': self.api_key,
                'address': location
            }
            
            response = requests.get(
                f"{self.base_url}/geocode/json",
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                return None, None
            
            data = response.json()
            
            if data.get('status') != 'OK' or not data.get('results'):
                return None, None
            
            location_data = data['results'][0]['geometry']['location']
            lat, lng = location_data['lat'], location_data['lng']
            
            # Cache for 24 hours
            cache.set(cache_key, (lat, lng), 86400)
            
            return lat, lng
            
        except Exception as e:
            logger.error(f"Error geocoding location {location}: {str(e)}")
            return None, None
    
    def _process_place_result(self, place: Dict) -> Optional[Dict]:
        """Process a Google Places search result into standardized format"""
        try:
            # Extract address components
            address_parts = place.get('formatted_address', '').split(', ')
            
            # Try to parse Czech address format
            city = ""
            postal_code = ""
            street = ""
            
            if len(address_parts) >= 2:
                # Last part is usually country
                if len(address_parts) >= 3:
                    # Second to last might be postal code + city
                    postal_city = address_parts[-2]
                    if postal_city:
                        parts = postal_city.split(' ')
                        if len(parts) >= 2 and parts[0].isdigit():
                            postal_code = parts[0]
                            city = ' '.join(parts[1:])
                        else:
                            city = postal_city
                
                # First part is usually street
                street = address_parts[0]
            
            business = {
                'place_id': place.get('place_id'),
                'name': place.get('name', ''),
                'address': place.get('formatted_address', ''),
                'street': street,
                'city': city,
                'postal_code': postal_code,
                'country': 'Czech Republic' if 'Czech' in place.get('formatted_address', '') or 'Česk' in place.get('formatted_address', '') else '',
                'phone': place.get('formatted_phone_number', ''),
                'website': place.get('website', ''),
                'rating': place.get('rating'),
                'total_ratings': place.get('user_ratings_total', 0),
                'business_status': place.get('business_status', ''),
                'types': place.get('types', []),
                'latitude': place.get('geometry', {}).get('location', {}).get('lat'),
                'longitude': place.get('geometry', {}).get('location', {}).get('lng'),
                'google_maps_url': f"https://maps.google.com/?cid={place.get('place_id', '')}"
            }
            
            # Determine business category from types
            business['category'] = self._categorize_business(place.get('types', []))
            
            return business
            
        except Exception as e:
            logger.error(f"Error processing place result: {str(e)}")
            return None
    
    def _process_place_details(self, place: Dict) -> Dict:
        """Process detailed place information"""
        try:
            # Extract structured address from adr_address if available
            adr_address = place.get('adr_address', '')
            street, city, postal_code = self._parse_adr_address(adr_address)
            
            details = {
                'name': place.get('name', ''),
                'address': place.get('formatted_address', ''),
                'street': street,
                'city': city,
                'postal_code': postal_code,
                'phone': place.get('international_phone_number', ''),
                'website': place.get('website', ''),
                'google_url': place.get('url', ''),
                'rating': place.get('rating'),
                'total_ratings': place.get('user_ratings_total', 0),
                'business_status': place.get('business_status', ''),
                'types': place.get('types', []),
                'opening_hours': place.get('opening_hours', {}).get('weekday_text', []),
                'reviews': []
            }
            
            # Process reviews
            for review in place.get('reviews', [])[:3]:  # Get top 3 reviews
                details['reviews'].append({
                    'author': review.get('author_name', ''),
                    'rating': review.get('rating'),
                    'text': review.get('text', ''),
                    'time': review.get('time')
                })
            
            return details
            
        except Exception as e:
            logger.error(f"Error processing place details: {str(e)}")
            return {}
    
    def _parse_adr_address(self, adr_address: str) -> Tuple[str, str, str]:
        """Parse structured adr_address HTML to extract address components"""
        street = ""
        city = ""
        postal_code = ""
        
        try:
            # Simple HTML parsing for address components
            if 'street-address' in adr_address:
                import re
                street_match = re.search(r'class="street-address"[^>]*>([^<]+)', adr_address)
                if street_match:
                    street = street_match.group(1).strip()
            
            if 'locality' in adr_address:
                city_match = re.search(r'class="locality"[^>]*>([^<]+)', adr_address)
                if city_match:
                    city = city_match.group(1).strip()
            
            if 'postal-code' in adr_address:
                postal_match = re.search(r'class="postal-code"[^>]*>([^<]+)', adr_address)
                if postal_match:
                    postal_code = postal_match.group(1).strip()
                    
        except Exception as e:
            logger.error(f"Error parsing adr_address: {str(e)}")
        
        return street, city, postal_code
    
    def _categorize_business(self, types: List[str]) -> str:
        """Categorize business based on Google Places types"""
        # Map Google types to our categories
        category_mapping = {
            'restaurant': 'restaurant',
            'food': 'restaurant',
            'meal_takeaway': 'restaurant',
            'cafe': 'restaurant',
            'bar': 'restaurant',
            'car_repair': 'automotive',
            'car_dealer': 'automotive',
            'gas_station': 'automotive',
            'beauty_salon': 'beauty',
            'hair_care': 'beauty',
            'spa': 'beauty',
            'doctor': 'healthcare',
            'dentist': 'healthcare',
            'hospital': 'healthcare',
            'pharmacy': 'healthcare',
            'lawyer': 'legal',
            'accounting': 'finance',
            'bank': 'finance',
            'insurance_agency': 'finance',
            'real_estate_agency': 'real_estate',
            'clothing_store': 'retail',
            'store': 'retail',
            'shopping_mall': 'retail',
            'gym': 'fitness',
            'school': 'education',
            'university': 'education',
            'lodging': 'hospitality',
            'travel_agency': 'travel'
        }
        
        for place_type in types:
            if place_type in category_mapping:
                return category_mapping[place_type]
        
        return 'other'


# Service instance
maps_service = GoogleMapsService()