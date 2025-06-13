"""
Czech Business Service - ARES API integration for company information
Replaces N8N Czech business registry functionality using official ARES REST API v3
"""

import logging
import requests
import time
from typing import Dict, List, Optional
from django.core.cache import cache
from datetime import datetime

logger = logging.getLogger(__name__)


class CzechBusinessService:
    """Czech ARES API service for comprehensive company information"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NextGenCRM/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        # ARES API v3 endpoints
        self.ares_base_url = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest"
        
        self.timeout = 30
        self.max_retries = 3
    
    def get_company_details(self, ico: str = None, company_name: str = None) -> Dict:
        """
        Get comprehensive company details from ARES
        
        Args:
            ico: Czech business ID (IČO)
            company_name: Company name for search
            
        Returns:
            Dictionary with company details
        """
        if not ico and not company_name:
            logger.error("Either ICO or company name must be provided")
            return {}
        
        # Cache key
        cache_key = f"ares_company_{ico or company_name}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached ARES data for: {ico or company_name}")
            return cached_result
        
        try:
            # Get company data from ARES
            if ico:
                company_data = self._get_ares_data_by_ico(ico)
            else:
                company_data = self._search_ares_by_name(company_name)
            
            if not company_data:
                logger.warning(f"No ARES data found for: {ico or company_name}")
                return {}
            
            # Enhance with detailed information
            enhanced_data = self._enhance_company_data(company_data)
            
            # Cache for 24 hours
            cache.set(cache_key, enhanced_data, 86400)
            
            logger.info(f"Successfully retrieved company details for: {enhanced_data.get('name', ico or company_name)}")
            return enhanced_data
            
        except Exception as e:
            logger.error(f"Error getting company details for {ico or company_name}: {str(e)}")
            return {}
    
    def search_companies(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for companies by name or ICO using ARES
        
        Args:
            query: Search term (company name or ICO)
            limit: Maximum number of results
            
        Returns:
            List of company dictionaries
        """
        try:
            companies = self._search_ares_companies(query, limit)
            
            # Enhance with additional details for top results
            enhanced_companies = []
            for i, company in enumerate(companies):
                if i < 3:  # Only enhance top 3 results
                    enhanced_data = self._enhance_company_data(company)
                    enhanced_companies.append(enhanced_data)
                else:
                    enhanced_companies.append(company)
            
            return enhanced_companies
            
        except Exception as e:
            logger.error(f"Error searching companies for query '{query}': {str(e)}")
            return []
    
    def get_business_activities(self, ico: str) -> List[Dict]:
        """
        Get detailed business activities (NACE codes) for a company
        
        Args:
            ico: Czech business ID
            
        Returns:
            List of business activity dictionaries
        """
        try:
            company_data = self._get_ares_data_by_ico(ico)
            return company_data.get('business_activities', [])
            
        except Exception as e:
            logger.error(f"Error getting business activities for ICO {ico}: {str(e)}")
            return []
    
    def _get_ares_data_by_ico(self, ico: str) -> Optional[Dict]:
        """Get company data from ARES by ICO"""
        try:
            url = f"{self.ares_base_url}/ekonomicky-subjekt/{ico}"
            
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 404:
                logger.warning(f"Company with ICO {ico} not found in ARES")
                return None
                
            response.raise_for_status()
            data = response.json()
            
            if not data or 'ico' not in data:
                return None
            
            return self._process_ares_response(data)
            
        except Exception as e:
            logger.error(f"Error getting ARES data for ICO {ico}: {str(e)}")
            return None
    
    def _search_ares_by_name(self, company_name: str) -> Optional[Dict]:
        """Search ARES by company name and return first match"""
        try:
            companies = self._search_ares_companies(company_name, 1)
            return companies[0] if companies else None
            
        except Exception as e:
            logger.error(f"Error searching ARES by name '{company_name}': {str(e)}")
            return None
    
    def _search_ares_companies(self, query: str, limit: int) -> List[Dict]:
        """Search multiple companies in ARES"""
        try:
            url = f"{self.ares_base_url}/ekonomicke-subjekty"
            
            # Determine search parameters
            if query.isdigit() and len(query) == 8:
                # ICO search
                params = {
                    'ico': query,
                    'start': 0,
                    'pocet': limit
                }
            else:
                # Name search
                params = {
                    'obchodniJmeno': query,
                    'start': 0,
                    'pocet': limit
                }
            
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            companies = []
            for item in data.get('ekonomickeSubjekty', []):
                # Get full details for each company
                ico = item.get('ico')
                if ico:
                    company_data = self._get_ares_data_by_ico(ico)
                    if company_data:
                        companies.append(company_data)
            
            return companies
            
        except Exception as e:
            logger.error(f"Error searching ARES companies for '{query}': {str(e)}")
            return []
    
    def _process_ares_response(self, data: Dict) -> Dict:
        """Process ARES API response into standardized format"""
        try:
            company_data = {
                'ico': data.get('ico'),
                'name': data.get('obchodniJmeno'),
                'legal_form': data.get('pravniForma', {}).get('nazev', ''),
                'legal_form_code': data.get('pravniForma', {}).get('kod', ''),
                'registration_date': data.get('datumVzniku'),
                'termination_date': data.get('datumZaniku'),
                'status': data.get('stavSubjektu'),
                'dic': data.get('dic'),  # Tax ID
                'business_activities': [],
                'address': {},
                'data_source': 'ares',
                'last_updated': datetime.now().isoformat()
            }
            
            # Process address
            if 'sidlo' in data:
                address = data['sidlo']
                company_data['address'] = {
                    'street': address.get('nazevUlice', ''),
                    'house_number': str(address.get('cisloDomovni', '')),
                    'orientation_number': str(address.get('cisloOrientacni', '')),
                    'city': address.get('nazevObce', ''),
                    'city_part': address.get('nazevCastiObce', ''),
                    'postal_code': address.get('psc', ''),
                    'district': address.get('nazevOkresu', ''),
                    'region': address.get('nazevKraje', ''),
                    'country': 'Czech Republic'
                }
                
                # Format full address
                address_parts = []
                if company_data['address']['street']:
                    street_part = company_data['address']['street']
                    if company_data['address']['house_number']:
                        street_part += f" {company_data['address']['house_number']}"
                        if company_data['address']['orientation_number']:
                            street_part += f"/{company_data['address']['orientation_number']}"
                    address_parts.append(street_part)
                
                if company_data['address']['city']:
                    city_part = ""
                    if company_data['address']['postal_code']:
                        city_part = f"{company_data['address']['postal_code']} "
                    city_part += company_data['address']['city']
                    address_parts.append(city_part)
                
                company_data['formatted_address'] = ', '.join(address_parts)
            
            # Process business activities
            if 'ekonomickeAktivity' in data:
                for activity in data['ekonomickeAktivity']:
                    if activity.get('nazev'):
                        company_data['business_activities'].append({
                            'nace_code': activity.get('nace', ''),
                            'description': activity.get('nazev', ''),
                            'is_primary': activity.get('hlavni', False)
                        })
            
            # Process statutory representatives (management)
            company_data['management'] = []
            if 'statutarniOrgany' in data:
                for organ in data['statutarniOrgany']:
                    if organ.get('nazev'):
                        company_data['management'].append({
                            'name': organ.get('nazev', ''),
                            'position': 'Statutární orgán',
                            'from_date': organ.get('datumVzniku'),
                            'to_date': organ.get('datumZaniku'),
                            'source': 'ares'
                        })
            
            return company_data
            
        except Exception as e:
            logger.error(f"Error processing ARES response: {str(e)}")
            return {}
    
    def _enhance_company_data(self, company_data: Dict) -> Dict:
        """Enhance company data with additional analysis"""
        try:
            enhanced_data = company_data.copy()
            
            # Analyze company size based on legal form
            legal_form = company_data.get('legal_form', '').lower()
            if 's.r.o.' in legal_form or 'společnost s ručením omezeným' in legal_form:
                enhanced_data['company_type'] = 'limited_liability'
                enhanced_data['estimated_size'] = 'small_medium'
            elif 'a.s.' in legal_form or 'akciová společnost' in legal_form:
                enhanced_data['company_type'] = 'joint_stock'
                enhanced_data['estimated_size'] = 'large'
            elif 'o.p.s.' in legal_form:
                enhanced_data['company_type'] = 'non_profit'
                enhanced_data['estimated_size'] = 'small'
            else:
                enhanced_data['company_type'] = 'other'
                enhanced_data['estimated_size'] = 'unknown'
            
            # Categorize business activities
            enhanced_data['industry_categories'] = self._categorize_business_activities(
                company_data.get('business_activities', [])
            )
            
            # Extract key personnel information
            enhanced_data['key_personnel'] = self._extract_key_personnel(
                company_data.get('management', [])
            )
            
            # Company age analysis
            if company_data.get('registration_date'):
                try:
                    reg_date = datetime.fromisoformat(company_data['registration_date'].replace('Z', '+00:00'))
                    age_days = (datetime.now() - reg_date.replace(tzinfo=None)).days
                    enhanced_data['company_age_years'] = round(age_days / 365.25, 1)
                    
                    if age_days < 365:
                        enhanced_data['company_maturity'] = 'startup'
                    elif age_days < 1825:  # 5 years
                        enhanced_data['company_maturity'] = 'young'
                    elif age_days < 3650:  # 10 years
                        enhanced_data['company_maturity'] = 'established'
                    else:
                        enhanced_data['company_maturity'] = 'mature'
                        
                except Exception:
                    enhanced_data['company_age_years'] = None
                    enhanced_data['company_maturity'] = 'unknown'
            
            return enhanced_data
            
        except Exception as e:
            logger.error(f"Error enhancing company data: {str(e)}")
            return company_data
    
    def _categorize_business_activities(self, activities: List[Dict]) -> List[str]:
        """Categorize business activities into industry sectors"""
        categories = set()
        
        # NACE code to category mapping (simplified)
        nace_categories = {
            # Agriculture, forestry and fishing
            '01': 'agriculture', '02': 'agriculture', '03': 'agriculture',
            # Manufacturing
            '10': 'manufacturing', '11': 'manufacturing', '12': 'manufacturing', '13': 'manufacturing',
            '14': 'manufacturing', '15': 'manufacturing', '16': 'manufacturing', '17': 'manufacturing',
            '18': 'manufacturing', '19': 'manufacturing', '20': 'manufacturing', '21': 'manufacturing',
            '22': 'manufacturing', '23': 'manufacturing', '24': 'manufacturing', '25': 'manufacturing',
            '26': 'manufacturing', '27': 'manufacturing', '28': 'manufacturing', '29': 'manufacturing',
            '30': 'manufacturing', '31': 'manufacturing', '32': 'manufacturing', '33': 'manufacturing',
            # Construction
            '41': 'construction', '42': 'construction', '43': 'construction',
            # Trade
            '45': 'trade', '46': 'trade', '47': 'trade',
            # Transportation
            '49': 'transportation', '50': 'transportation', '51': 'transportation', '52': 'transportation', '53': 'transportation',
            # Accommodation and food service
            '55': 'hospitality', '56': 'hospitality',
            # Information and communication
            '58': 'technology', '59': 'technology', '60': 'technology', '61': 'technology', '62': 'technology', '63': 'technology',
            # Financial and insurance
            '64': 'finance', '65': 'finance', '66': 'finance',
            # Real estate
            '68': 'real_estate',
            # Professional, scientific and technical
            '69': 'professional_services', '70': 'professional_services', '71': 'professional_services',
            '72': 'professional_services', '73': 'professional_services', '74': 'professional_services', '75': 'professional_services',
            # Education
            '85': 'education',
            # Human health and social work
            '86': 'healthcare', '87': 'healthcare', '88': 'healthcare',
            # Arts, entertainment and recreation
            '90': 'entertainment', '91': 'entertainment', '92': 'entertainment', '93': 'entertainment'
        }
        
        for activity in activities:
            nace_code = activity.get('nace_code', '')
            if len(nace_code) >= 2:
                category = nace_categories.get(nace_code[:2])
                if category:
                    categories.add(category)
        
        return list(categories)
    
    def _extract_key_personnel(self, management: List[Dict]) -> List[Dict]:
        """Extract and format key personnel information"""
        key_personnel = []
        
        for person in management:
            # Skip if terminated
            if person.get('to_date'):
                continue
                
            name = person.get('name', '')
            position = person.get('position', '')
            
            # Try to parse name into first/last name
            name_parts = name.split()
            if len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
            else:
                first_name = name
                last_name = ''
            
            key_personnel.append({
                'full_name': name,
                'first_name': first_name,
                'last_name': last_name,
                'position': position,
                'is_active': not bool(person.get('to_date')),
                'source': 'ares'
            })
        
        return key_personnel


# Service instance
czech_business_service = CzechBusinessService()