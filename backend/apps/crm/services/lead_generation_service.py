"""
Lead Generation Service - Orchestrates all lead generation services
Replaces N8N workflow with integrated Python services
"""

import logging
import asyncio
from typing import Dict, List, Optional
from django.utils import timezone
from django.db import transaction

from .maps_service import maps_service
from .scraping_service import scraping_service
from .czech_business_service import czech_business_service
from .ai_analysis_service import ai_analysis_service
from .deduplication_service import deduplication_service

logger = logging.getLogger(__name__)


class LeadGenerationService:
    """Orchestrates the complete lead generation workflow"""
    
    def __init__(self):
        self.max_prospects_per_campaign = 100
        self.default_search_radius = 5000  # 5km
    
    def generate_prospects_campaign(self, campaign_config: Dict) -> Dict:
        """
        Generate prospects for a campaign using all available services
        
        Args:
            campaign_config: Dictionary with campaign configuration
                - keyword: Business type keyword
                - location: Target location
                - max_results: Maximum prospects to generate
                - enable_ai_analysis: Whether to use AI analysis
                - enable_website_scraping: Whether to scrape websites
                - enable_deduplication: Whether to check for duplicates
                
        Returns:
            Dictionary with campaign results
        """
        try:
            logger.info(f"Starting lead generation campaign: {campaign_config.get('keyword')} in {campaign_config.get('location')}")
            
            # Extract configuration
            keyword = campaign_config.get('keyword', '')
            location = campaign_config.get('location', '')
            max_results = min(campaign_config.get('max_results', 20), self.max_prospects_per_campaign)
            enable_ai = campaign_config.get('enable_ai_analysis', True)
            enable_scraping = campaign_config.get('enable_website_scraping', True)
            enable_dedup = campaign_config.get('enable_deduplication', True)
            
            if not keyword or not location:
                return {'error': 'Keyword and location are required'}
            
            # Step 1: Search for businesses using Google Maps
            logger.info("Step 1: Searching businesses with Google Maps")
            businesses = maps_service.search_businesses(
                keyword=keyword,
                location=location,
                radius=campaign_config.get('radius', self.default_search_radius),
                max_results=max_results * 2  # Get more to filter later
            )
            
            if not businesses:
                return {
                    'success': False,
                    'error': 'No businesses found for the given criteria',
                    'prospects': []
                }
            
            logger.info(f"Found {len(businesses)} businesses from Google Maps")
            
            # Step 2: Process each business
            prospects = []
            processed_count = 0
            
            for business in businesses:
                if len(prospects) >= max_results:
                    break
                
                try:
                    processed_count += 1
                    logger.info(f"Processing business {processed_count}/{len(businesses)}: {business.get('name', 'Unknown')}")
                    
                    prospect = self._process_single_business(
                        business, 
                        enable_scraping=enable_scraping,
                        enable_ai=enable_ai,
                        enable_dedup=enable_dedup,
                        keyword=keyword,
                        location=location
                    )
                    
                    if prospect and prospect.get('quality_score', 0) > 30:  # Basic quality threshold
                        prospects.append(prospect)
                    
                except Exception as e:
                    logger.error(f"Error processing business {business.get('name', 'Unknown')}: {str(e)}")
                    continue
            
            # Step 3: Final deduplication across all prospects
            if enable_dedup and len(prospects) > 1:
                logger.info("Step 3: Final deduplication")
                dedup_results = deduplication_service.deduplicate_prospect_list(prospects)
                prospects = dedup_results['unique_prospects']
                logger.info(f"Deduplication: {dedup_results['duplicates_removed']} duplicates removed")
            
            # Step 4: Sort by quality score
            prospects.sort(key=lambda x: x.get('quality_score', 0), reverse=True)
            
            campaign_results = {
                'success': True,
                'campaign_config': campaign_config,
                'prospects': prospects[:max_results],
                'total_found': len(businesses),
                'total_processed': processed_count,
                'total_qualified': len(prospects),
                'generated_at': timezone.now().isoformat(),
                'services_used': self._get_services_used(enable_scraping, enable_ai, enable_dedup)
            }
            
            logger.info(f"Campaign completed: {len(prospects)} qualified prospects generated")
            return campaign_results
            
        except Exception as e:
            logger.error(f"Error in lead generation campaign: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'prospects': []
            }
    
    def enrich_existing_prospect(self, prospect_data: Dict) -> Dict:
        """
        Enrich an existing prospect with additional data
        
        Args:
            prospect_data: Existing prospect data
            
        Returns:
            Dictionary with enriched prospect data
        """
        try:
            logger.info(f"Enriching prospect: {prospect_data.get('company_name', 'Unknown')}")
            
            enriched = prospect_data.copy()
            enrichment_log = []
            
            # Step 1: ARES enrichment if ICO available
            ico = prospect_data.get('ico')
            if ico:
                logger.info("Step 1: ARES enrichment")
                ares_data = czech_business_service.get_company_details(ico=ico)
                if ares_data:
                    enriched.update({
                        'legal_form': ares_data.get('legal_form', ''),
                        'registration_date': ares_data.get('registration_date', ''),
                        'business_activities': ares_data.get('business_activities', []),
                        'formatted_address': ares_data.get('formatted_address', ''),
                        'management': ares_data.get('key_personnel', [])
                    })
                    enrichment_log.append('ares_data')
            
            # Step 2: Website scraping if website available
            website = prospect_data.get('website')
            if website:
                logger.info("Step 2: Website scraping")
                website_data = scraping_service.analyze_website(website)
                if website_data.get('accessible'):
                    # Extract contact info
                    contact_info = website_data.get('contact_info', {})
                    if contact_info.get('emails'):
                        enriched['additional_emails'] = contact_info['emails']
                    if contact_info.get('phones'):
                        enriched['additional_phones'] = contact_info['phones']
                    
                    # Add website analysis
                    enriched['website_analysis'] = {
                        'title': website_data.get('title', ''),
                        'description': website_data.get('description', ''),
                        'services': website_data.get('services', []),
                        'technologies': website_data.get('technologies', []),
                        'content_quality': website_data.get('content_quality', {})
                    }
                    enrichment_log.append('website_scraping')
            
            # Step 3: AI analysis
            logger.info("Step 3: AI analysis")
            ai_analysis = ai_analysis_service.analyze_prospect_quality(enriched)
            if not ai_analysis.get('error'):
                enriched['ai_analysis'] = ai_analysis
                enriched['quality_score'] = ai_analysis.get('quality_score', 0)
                enriched['validation_status'] = ai_analysis.get('validation_status', 'needs_review')
                enrichment_log.append('ai_analysis')
            
            # Step 4: Generate summary
            if len(enrichment_log) > 1:
                logger.info("Step 4: Generating AI summary")
                summary = ai_analysis_service.generate_prospect_summary(enriched)
                if not summary.get('error'):
                    enriched['ai_summary'] = summary
                    enrichment_log.append('ai_summary')
            
            enriched['enrichment_log'] = enrichment_log
            enriched['enriched_at'] = timezone.now().isoformat()
            
            logger.info(f"Enrichment completed with services: {', '.join(enrichment_log)}")
            return enriched
            
        except Exception as e:
            logger.error(f"Error enriching prospect: {str(e)}")
            return {**prospect_data, 'enrichment_error': str(e)}
    
    def bulk_enrich_prospects(self, prospects: List[Dict], max_concurrent: int = 3) -> List[Dict]:
        """
        Bulk enrich multiple prospects with rate limiting
        
        Args:
            prospects: List of prospect dictionaries
            max_concurrent: Maximum concurrent enrichments
            
        Returns:
            List of enriched prospects
        """
        try:
            logger.info(f"Starting bulk enrichment of {len(prospects)} prospects")
            
            enriched_prospects = []
            
            # Process in batches to avoid rate limiting
            for i in range(0, len(prospects), max_concurrent):
                batch = prospects[i:i + max_concurrent]
                logger.info(f"Processing batch {i//max_concurrent + 1}/{(len(prospects) + max_concurrent - 1)//max_concurrent}")
                
                batch_results = []
                for prospect in batch:
                    enriched = self.enrich_existing_prospect(prospect)
                    batch_results.append(enriched)
                
                enriched_prospects.extend(batch_results)
                
                # Small delay between batches
                if i + max_concurrent < len(prospects):
                    import time
                    time.sleep(1)
            
            logger.info(f"Bulk enrichment completed: {len(enriched_prospects)} prospects processed")
            return enriched_prospects
            
        except Exception as e:
            logger.error(f"Error in bulk enrichment: {str(e)}")
            return prospects  # Return original on error
    
    def validate_campaign_config(self, config: Dict) -> Dict:
        """
        Validate campaign configuration
        
        Args:
            config: Campaign configuration dictionary
            
        Returns:
            Dictionary with validation results
        """
        errors = []
        warnings = []
        
        # Required fields
        if not config.get('keyword'):
            errors.append('Keyword is required')
        
        if not config.get('location'):
            errors.append('Location is required')
        
        # Validate max_results
        max_results = config.get('max_results', 20)
        if not isinstance(max_results, int) or max_results < 1:
            errors.append('max_results must be a positive integer')
        elif max_results > self.max_prospects_per_campaign:
            warnings.append(f'max_results capped at {self.max_prospects_per_campaign}')
        
        # Validate radius
        radius = config.get('radius', self.default_search_radius)
        if not isinstance(radius, int) or radius < 100:
            warnings.append('radius should be at least 100 meters')
        elif radius > 50000:
            warnings.append('radius should not exceed 50km for optimal results')
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _process_single_business(self, business: Dict, enable_scraping: bool = True, 
                               enable_ai: bool = True, enable_dedup: bool = True,
                               keyword: str = '', location: str = '') -> Optional[Dict]:
        """Process a single business from Google Maps data"""
        try:
            # Build basic prospect data
            prospect = {
                'company_name': business.get('name', ''),
                'website': business.get('website', ''),
                'phone_number': business.get('phone', ''),
                'location': business.get('address', ''),
                'address_city': business.get('city', ''),
                'address_street': business.get('street', ''),
                'address_postal_code': business.get('postal_code', ''),
                'industry': business.get('category', ''),
                'google_rating': business.get('rating'),
                'google_reviews_count': business.get('total_ratings', 0),
                'google_place_id': business.get('place_id', ''),
                'latitude': business.get('latitude'),
                'longitude': business.get('longitude'),
                'source_keyword': keyword,
                'source_location': location,
                'generated_at': timezone.now().isoformat()
            }
            
            # Step 1: Website scraping for contact info
            if enable_scraping and prospect['website']:
                try:
                    logger.debug(f"Scraping website: {prospect['website']}")
                    website_data = scraping_service.extract_contact_info(prospect['website'])
                    
                    if website_data:
                        # Extract email
                        emails = website_data.get('emails', [])
                        if emails:
                            # Prefer non-generic emails
                            non_generic = [e for e in emails if not any(g in e.lower() for g in ['info@', 'contact@', 'admin@'])]
                            prospect['email_address'] = non_generic[0] if non_generic else emails[0]
                        
                        # Extract personnel
                        personnel = scraping_service.find_key_personnel(prospect['website'])
                        if personnel:
                            top_person = personnel[0]
                            prospect['contact_name'] = top_person.get('full_name', '')
                            prospect['contact_title'] = top_person.get('position', '')
                            
                            # Try to split name
                            name_parts = prospect['contact_name'].split()
                            if len(name_parts) >= 2:
                                prospect['contact_first_name'] = name_parts[0]
                                prospect['contact_last_name'] = ' '.join(name_parts[1:])
                        
                        # Extract business info
                        business_info = website_data.get('business_info', {})
                        if business_info.get('ico'):
                            prospect['ico'] = business_info['ico']
                        
                        prospect['website_scraped'] = True
                
                except Exception as e:
                    logger.warning(f"Website scraping failed for {prospect['website']}: {str(e)}")
                    prospect['website_scraped'] = False
            
            # Step 2: ARES enrichment if ICO found
            if prospect.get('ico'):
                try:
                    logger.debug(f"ARES lookup for ICO: {prospect['ico']}")
                    ares_data = czech_business_service.get_company_details(ico=prospect['ico'])
                    
                    if ares_data:
                        prospect.update({
                            'legal_form': ares_data.get('legal_form', ''),
                            'registration_date': ares_data.get('registration_date', ''),
                            'business_activities': ares_data.get('business_activities', []),
                            'management': ares_data.get('key_personnel', []),
                            'ares_enriched': True
                        })
                        
                        # Update contact from ARES management if not found
                        if not prospect.get('contact_name') and ares_data.get('key_personnel'):
                            top_manager = ares_data['key_personnel'][0]
                            prospect['contact_name'] = top_manager.get('full_name', '')
                            prospect['contact_first_name'] = top_manager.get('first_name', '')
                            prospect['contact_last_name'] = top_manager.get('last_name', '')
                            prospect['contact_title'] = top_manager.get('position', '')
                
                except Exception as e:
                    logger.warning(f"ARES enrichment failed for ICO {prospect.get('ico')}: {str(e)}")
                    prospect['ares_enriched'] = False
            
            # Step 3: Deduplication check
            if enable_dedup:
                try:
                    from ..models import Prospect
                    dedup_result = deduplication_service.check_for_duplicates(prospect, Prospect)
                    
                    if dedup_result.get('is_duplicate') and dedup_result.get('confidence', 0) > 80:
                        logger.info(f"Skipping duplicate prospect: {prospect['company_name']}")
                        return None  # Skip this prospect
                    
                    prospect['dedup_checked'] = True
                    prospect['dedup_confidence'] = dedup_result.get('confidence', 0)
                
                except Exception as e:
                    logger.warning(f"Deduplication check failed: {str(e)}")
                    prospect['dedup_checked'] = False
            
            # Step 4: AI quality analysis
            if enable_ai:
                try:
                    logger.debug(f"AI analysis for: {prospect['company_name']}")
                    ai_analysis = ai_analysis_service.analyze_prospect_quality(prospect)
                    
                    if not ai_analysis.get('error'):
                        prospect['quality_score'] = ai_analysis.get('quality_score', 0)
                        prospect['validation_status'] = ai_analysis.get('validation_status', 'needs_review')
                        prospect['ai_recommendations'] = ai_analysis.get('recommendations', [])
                        prospect['target_persona'] = ai_analysis.get('target_persona', '')
                        prospect['ai_analyzed'] = True
                    else:
                        prospect['quality_score'] = 50  # Default score
                        prospect['ai_analyzed'] = False
                
                except Exception as e:
                    logger.warning(f"AI analysis failed: {str(e)}")
                    prospect['quality_score'] = 50
                    prospect['ai_analyzed'] = False
            else:
                # Basic scoring without AI
                prospect['quality_score'] = self._calculate_basic_quality_score(prospect)
            
            return prospect
            
        except Exception as e:
            logger.error(f"Error processing business {business.get('name', 'Unknown')}: {str(e)}")
            return None
    
    def _calculate_basic_quality_score(self, prospect: Dict) -> int:
        """Calculate basic quality score without AI"""
        score = 0
        
        # Company name
        if prospect.get('company_name'):
            score += 20
        
        # Contact information
        if prospect.get('email_address'):
            score += 25
        if prospect.get('phone_number'):
            score += 15
        if prospect.get('website'):
            score += 15
        
        # Contact person
        if prospect.get('contact_name'):
            score += 15
        
        # Business info
        if prospect.get('ico'):
            score += 10
        
        return min(score, 100)
    
    def _get_services_used(self, enable_scraping: bool, enable_ai: bool, enable_dedup: bool) -> List[str]:
        """Get list of services used in the campaign"""
        services = ['google_maps']
        
        if enable_scraping:
            services.append('website_scraping')
        
        services.append('ares_registry')
        
        if enable_ai:
            services.append('ai_analysis')
        
        if enable_dedup:
            services.append('deduplication')
        
        return services


# Service instance
lead_generation_service = LeadGenerationService()