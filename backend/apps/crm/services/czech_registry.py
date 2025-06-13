"""
Czech Business Registry (ARES) Integration Service

This service integrates with the Czech ARES (Administrativní registr ekonomických subjektů) 
to automatically enrich prospect data based on ICO (business ID).

API Documentation: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/v3/api-docs
"""

import requests
import json
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CzechRegistryService:
    """Service for fetching company data from Czech ARES registry using REST API v3"""
    
    ARES_BASE_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NextGenCRM/1.0 (Business Data Enrichment)'
        })
    
    def validate_ico(self, ico: str) -> bool:
        """
        Validate Czech ICO (business ID) format and checksum.
        ICO must be 8 digits with valid checksum.
        """
        if not ico:
            return False
        
        # Clean and pad to 8 digits
        ico_clean = ''.join(filter(str.isdigit, str(ico)))
        if not ico_clean:
            return False
            
        ico = ico_clean.zfill(8)
        
        if len(ico) != 8:
            return False
        
        # Calculate checksum
        weights = [8, 7, 6, 5, 4, 3, 2]
        checksum = sum(int(ico[i]) * weights[i] for i in range(7))
        remainder = checksum % 11
        
        if remainder < 2:
            expected_check_digit = remainder
        else:
            expected_check_digit = 11 - remainder
        
        return int(ico[7]) == expected_check_digit
    
    def fetch_company_data(self, ico: str) -> Optional[Dict[str, Any]]:
        """
        Fetch company data from ARES registry by ICO using REST API v3.
        
        Args:
            ico: Czech business ID (8 digits)
            
        Returns:
            Dictionary with company data or None if not found
        """
        if not self.validate_ico(ico):
            logger.warning(f"Invalid ICO format: {ico}")
            return None
        
        # Ensure ICO is 8 digits
        ico = ico.zfill(8)
        
        try:
            # Use the general economic subjects endpoint
            url = f"{self.ARES_BASE_URL}/ekonomicke-subjekty/{ico}"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            
            # Extract company record
            company_record = self._parse_ares_v3_response(data)
            
            if company_record:
                # Try to get detailed data from VR (Public Register) for CEO info
                vr_data = self._fetch_vr_details(ico)
                if vr_data:
                    company_record.update(vr_data)
                
                logger.info(f"Successfully fetched data for ICO: {ico}")
                return company_record
            else:
                logger.warning(f"No data found for ICO: {ico}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Request failed for ICO {ico}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for ICO {ico}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error for ICO {ico}: {e}")
            return None
    
    def _fetch_vr_details(self, ico: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed company data from VR (Public Register) source.
        This may include CEO and management information.
        """
        try:
            url = f"{self.ARES_BASE_URL}/ekonomicke-subjekty-vr/{ico}"
            
            response = self.session.get(url, timeout=10)
            if response.status_code == 404:
                # Company not in VR register
                return None
            
            response.raise_for_status()
            vr_data = response.json()
            
            # Extract management information
            additional_data = {}
            
            # Look for statutory representatives (CEOs, directors)
            if 'zapisVr' in vr_data:
                zapis = vr_data['zapisVr']
                if 'zakonniZastupci' in zapis:
                    representatives = []
                    for rep in zapis['zakonniZastupci']:
                        rep_info = {}
                        if 'jmeno' in rep:
                            rep_info['name'] = rep['jmeno']
                        if 'funkce' in rep:
                            rep_info['position'] = rep['funkce']
                        if rep_info:
                            representatives.append(rep_info)
                    
                    if representatives:
                        additional_data['management'] = representatives
                        # Set first as primary contact if it's CEO/director
                        for rep in representatives:
                            if any(title in rep.get('position', '').lower() 
                                  for title in ['jednatel', 'ředitel', 'předseda', 'ceo']):
                                additional_data['ceo_name'] = rep.get('name')
                                break
            
            return additional_data if additional_data else None
            
        except Exception as e:
            logger.warning(f"Could not fetch VR details for ICO {ico}: {e}")
            return None
    
    def _parse_ares_v3_response(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse ARES REST API v3 JSON response and extract company data"""
        
        try:
            # Extract basic company information
            company_data = {}
            
            # ICO
            if 'ico' in data:
                company_data['ico'] = data['ico']
            
            # Company name - the field is directly 'obchodniJmeno'
            if 'obchodniJmeno' in data:
                company_data['company_name'] = data['obchodniJmeno']
            
            # Legal form - it's just a string code, not an object
            if 'pravniForma' in data:
                company_data['legal_form_code'] = data['pravniForma']
                # Map common legal form codes to readable names
                legal_forms = {
                    '101': 'Fyzická osoba podnikající podle živnostenského zákona',
                    '112': 'Společnost s ručením omezeným',
                    '121': 'Akciová společnost',
                    '301': 'Státní podnik',
                    '421': 'Obecně prospěšná společnost',
                    '511': 'Zapsaný spolek',
                    '551': 'Církev',
                    '601': 'Obecní úřad',
                    '611': 'Krajský úřad',
                    '651': 'Ministerstvo',
                    '701': 'Zahraniční osoba',
                    '801': 'Podnikající fyzická osoba',
                    '901': 'Zahraniční fyzická osoba'
                }
                company_data['legal_form'] = legal_forms.get(data['pravniForma'], f"Právní forma {data['pravniForma']}")
            
            # Address
            address_data = self._parse_v3_address(data)
            if address_data:
                company_data.update(address_data)
            
            # Business activities (NACE codes)
            activities = self._parse_v3_activities(data)
            if activities:
                company_data['business_activities'] = activities
                # Set primary activity as industry
                if activities:
                    company_data['industry'] = activities[0].get('description', '')
            
            # Registration date
            if 'datumVzniku' in data:
                try:
                    date_str = data['datumVzniku']
                    company_data['registration_date'] = datetime.strptime(
                        date_str, '%Y-%m-%d'
                    ).isoformat()
                except (ValueError, TypeError):
                    pass
            
            # Tax ID (DIC)
            if 'dic' in data:
                company_data['tax_id'] = data['dic']
            
            # Registration status
            if 'seznamRegistraci' in data:
                registrations = data['seznamRegistraci']
                active_registrations = []
                for key, value in registrations.items():
                    if value == 'AKTIVNI':
                        active_registrations.append(key.replace('stavZdroje', '').upper())
                if active_registrations:
                    company_data['registration_sources'] = active_registrations
            
            return company_data if company_data else None
            
        except Exception as e:
            logger.error(f"Error parsing ARES v3 response: {e}")
            return None
    
    def _parse_v3_address(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Parse address information from ARES v3 response"""
        address_data = {}
        
        try:
            # Address is in 'sidlo' field
            if 'sidlo' not in data:
                return address_data
            
            sidlo = data['sidlo']
            
            # Build street address from components
            street_parts = []
            if 'nazevUlice' in sidlo:
                street_parts.append(sidlo['nazevUlice'])
            if 'cisloDomovni' in sidlo:
                street_parts.append(str(sidlo['cisloDomovni']))
            if 'cisloOrientacni' in sidlo:
                street_parts.append(f"/{sidlo['cisloOrientacni']}")
            
            if street_parts:
                address_data['address_street'] = ' '.join(street_parts)
            
            # City
            if 'nazevObce' in sidlo:
                address_data['address_city'] = sidlo['nazevObce']
            
            # Postal code
            if 'psc' in sidlo:
                address_data['address_postal_code'] = str(sidlo['psc'])
            
            # State/Region (okres = district)
            if 'nazevOkresu' in sidlo:
                address_data['address_state'] = sidlo['nazevOkresu']
            elif 'nazevKraje' in sidlo:
                # Use region if district not available
                address_data['address_state'] = sidlo['nazevKraje']
            
            # Always Czech Republic for ARES data
            address_data['address_country'] = 'Czech Republic'
            
        except Exception as e:
            logger.error(f"Error parsing v3 address: {e}")
        
        return address_data
    
    def _parse_v3_activities(self, data: Dict[str, Any]) -> list:
        """Parse business activities (NACE codes) from ARES v3 response"""
        activities = []
        
        try:
            # NACE codes are in 'czNace' field as a list of strings
            if 'czNace' in data and isinstance(data['czNace'], list):
                for nace_code in data['czNace'][:10]:  # Limit to first 10 activities
                    # Convert NACE code to readable description (simplified mapping)
                    description = self._get_nace_description(str(nace_code))
                    activities.append({
                        'nace_code': str(nace_code),
                        'description': description
                    })
            
        except Exception as e:
            logger.error(f"Error parsing v3 activities: {e}")
        
        return activities
    
    def _get_nace_description(self, nace_code: str) -> str:
        """Get human-readable description for NACE code"""
        # Simplified mapping of common NACE codes to descriptions
        nace_descriptions = {
            # Manufacturing
            '29100': 'Výroba motorových vozidel',
            '18130': 'Příprava k tisku a vydavatelské služby',
            '26300': 'Výroba komunikačních zařízení',
            '27120': 'Výroba rozvodných a řídících elektrických zařízení',
            '28230': 'Výroba kancelářských strojů a počítačů',
            
            # Construction and services
            '43220': 'Instalace vodoinstalatérství, plynárenství a topení',
            '43342': 'Malířské a sklenářské práce',
            '43320': 'Truhlářské práce',
            '43390': 'Ostatní dokončovací práce',
            '45200': 'Údržba a oprava motorových vozidel',
            
            # Trade
            '46190': 'Zprostředkování velkoobchodu se smíšeným zbožím',
            '471': 'Maloobchodní prodej v nespecializovaných prodejnách',
            '47740': 'Maloobchodní prodej lékařských a ortopedických potřeb',
            
            # Transport and logistics
            '49393': 'Mezinárodní silniční nákladní doprava',
            '49410': 'Nákladní silniční doprava',
            '52100': 'Skladování',
            '52210': 'Doplňkové služby pro dopravu',
            '53100': 'Poštovní činnosti',
            '53200': 'Kurýrní činnosti',
            
            # Food and accommodation
            '56100': 'Stravování v restauracích',
            '5590': 'Ostatní ubytování',
            
            # ICT and telecommunications
            '61': 'Telekomunikační činnosti',
            '6120': 'Bezdrátové telekomunikační činnosti',
            '63': 'Informační činnosti',
            
            # Financial services
            '64929': 'Ostatní finanční služby',
            '66': 'Pomocné činnosti v pojišťovnictví a penzijních fondech',
            '66190': 'Ostatní činnosti pomáhající finančním službám',
            '653': 'Neživotní pojištění',
            
            # Professional services
            '6920': 'Účetní, vedení účetnictví a daňové poradenství',
            '69200': 'Ostatní účetní činnosti',
            '702': 'Poradenství v oblasti řízení',
            '711': 'Architektonické a inženýrské činnosti',
            '7219': 'Výzkum a vývoj v ostatních přírodních vědách',
            '74300': 'Překladatelské a tlumočnické činnosti',
            
            # Other services
            '772': 'Pronájem osobního zboží a domácích potřeb',
            '77110': 'Pronájem osobních automobilů',
            '82920': 'Balicí činnosti',
            '8532': 'Odborné vzdělávání',
            '854': 'Vyšší odborné vzdělávání',
            '8553': 'Výuka jízdy',
            '86220': 'Praxe lékařů specialistů',
            '92000': 'Provozování hazardních her',
            '93290': 'Ostatní zábavní a rekreační činnosti',
            '95110': 'Oprava počítačů a periferních zařízení',
            
            # General codes
            '181': 'Tisk a rozmnožování nahraných nosičů',
            '4725': 'Maloobchodní prodej nápojů'
        }
        
        return nace_descriptions.get(nace_code, f'NACE {nace_code}')
    
    def enrich_prospect_data(self, prospect_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich prospect data using ICO lookup.
        
        Args:
            prospect_data: Existing prospect data dictionary
            
        Returns:
            Updated prospect data with enriched information
        """
        try:
            ico = prospect_data.get('ico')
            if not ico:
                logger.warning("No ICO provided for enrichment")
                return prospect_data
            
            logger.info(f"Starting enrichment for ICO: {ico}")
            
            # Fetch data from ARES
            ares_data = self.fetch_company_data(ico)
            if not ares_data:
                logger.warning(f"No ARES data found for ICO: {ico}")
                return prospect_data
            
            logger.info(f"Retrieved ARES data for ICO {ico}: {list(ares_data.keys())}")
            
            # Create enriched data, preserving existing values
            enriched_data = prospect_data.copy()
            
            # Always overwrite company name and address data from registry
            mapping = {
                'company_name': 'company_name',
                'industry': 'industry',
                'address_street': 'address_street',
                'address_city': 'address_city',
                'address_state': 'address_state',
                'address_postal_code': 'address_postal_code',
                'address_country': 'address_country',
            }
            
            updated_fields = []
            for ares_field, prospect_field in mapping.items():
                if ares_field in ares_data and ares_data[ares_field]:
                    enriched_data[prospect_field] = ares_data[ares_field]
                    updated_fields.append(prospect_field)
            
            # Add additional fields including CEO information
            additional_fields = ['legal_form', 'legal_form_code', 'registration_date', 'business_activities', 'employee_count_range', 'tax_id', 'ceo_name', 'management']
            for field in additional_fields:
                if field in ares_data:
                    enriched_data[field] = ares_data[field]
                    updated_fields.append(field)
            
            # If we have CEO information, also update contact fields
            if ares_data.get('ceo_name'):
                # Split CEO name into first and last name
                ceo_name = ares_data['ceo_name']
                name_parts = ceo_name.split()
                if len(name_parts) >= 2:
                    enriched_data['contact_first_name'] = name_parts[0]
                    enriched_data['contact_last_name'] = ' '.join(name_parts[1:])
                    enriched_data['contact_name'] = ceo_name
                    updated_fields.extend(['contact_first_name', 'contact_last_name', 'contact_name'])
                else:
                    enriched_data['contact_name'] = ceo_name
                    updated_fields.append('contact_name')
            
            # Mark as enriched
            enriched_data['ico_enriched'] = True
            enriched_data['ico_enriched_at'] = datetime.now().isoformat()
            
            logger.info(f"Enrichment successful for ICO {ico}. Updated fields: {updated_fields}")
            
            return enriched_data
            
        except Exception as e:
            logger.error(f"Error in enrich_prospect_data: {e}")
            return prospect_data


# Global instance
czech_registry_service = CzechRegistryService()