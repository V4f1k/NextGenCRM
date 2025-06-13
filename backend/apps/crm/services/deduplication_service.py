"""
Deduplication Service - Prevent duplicate prospects across campaigns
Advanced deduplication with fuzzy matching and AI assistance
"""

import logging
import difflib
import re
from typing import Dict, List, Optional, Tuple, Set
from django.db.models import Q
from django.core.cache import cache
from .ai_analysis_service import ai_analysis_service

logger = logging.getLogger(__name__)


class DeduplicationService:
    """Service for preventing and managing duplicate prospects"""
    
    def __init__(self):
        self.similarity_threshold = 0.85  # Threshold for considering items as duplicates
        self.email_weight = 0.4           # Weight for email similarity
        self.company_weight = 0.3         # Weight for company name similarity
        self.phone_weight = 0.15          # Weight for phone similarity
        self.address_weight = 0.15        # Weight for address similarity
    
    def check_for_duplicates(self, new_prospect: Dict, model_class=None) -> Dict:
        """
        Check if a new prospect is a duplicate of existing ones
        
        Args:
            new_prospect: Dictionary with new prospect data
            model_class: Django model class to search (optional, for DB queries)
            
        Returns:
            Dictionary with duplicate check results
        """
        try:
            # Get existing prospects for comparison
            existing_prospects = self._get_existing_prospects(new_prospect, model_class)
            
            if not existing_prospects:
                return {
                    'is_duplicate': False,
                    'confidence': 0,
                    'duplicates': [],
                    'method': 'no_existing_data'
                }
            
            # Perform fuzzy matching
            fuzzy_results = self._fuzzy_match_prospects(new_prospect, existing_prospects)
            
            # If high confidence duplicates found, return immediately
            if fuzzy_results['confidence'] > 90:
                return fuzzy_results
            
            # For medium confidence cases, use AI analysis
            if fuzzy_results['confidence'] > 50:
                ai_results = self._ai_duplicate_check(new_prospect, fuzzy_results['duplicates'])
                
                # Combine fuzzy and AI results
                return self._combine_detection_results(fuzzy_results, ai_results)
            
            return fuzzy_results
            
        except Exception as e:
            logger.error(f"Error in duplicate check: {str(e)}")
            return {
                'is_duplicate': False,
                'confidence': 0,
                'error': str(e),
                'method': 'error'
            }
    
    def find_similar_prospects(self, prospect: Dict, limit: int = 10, model_class=None) -> List[Dict]:
        """
        Find prospects similar to the given one
        
        Args:
            prospect: Prospect data to find similarities for
            limit: Maximum number of similar prospects to return
            model_class: Django model class to search
            
        Returns:
            List of similar prospects with similarity scores
        """
        try:
            existing_prospects = self._get_existing_prospects(prospect, model_class, limit * 2)
            similar_prospects = []
            
            for existing in existing_prospects:
                similarity = self._calculate_similarity(prospect, existing)
                
                if similarity > 0.3:  # Minimum similarity threshold
                    similar_prospects.append({
                        'prospect': existing,
                        'similarity_score': similarity,
                        'matching_fields': self._identify_matching_fields(prospect, existing)
                    })
            
            # Sort by similarity and return top results
            similar_prospects.sort(key=lambda x: x['similarity_score'], reverse=True)
            return similar_prospects[:limit]
            
        except Exception as e:
            logger.error(f"Error finding similar prospects: {str(e)}")
            return []
    
    def deduplicate_prospect_list(self, prospects: List[Dict]) -> Dict:
        """
        Deduplicate a list of prospects
        
        Args:
            prospects: List of prospect dictionaries
            
        Returns:
            Dictionary with deduplication results
        """
        try:
            unique_prospects = []
            duplicates = []
            processed_ids = set()
            
            for i, prospect in enumerate(prospects):
                if i in processed_ids:
                    continue
                
                # Find duplicates of this prospect in the remaining list
                prospect_duplicates = []
                
                for j, other_prospect in enumerate(prospects[i+1:], i+1):
                    if j in processed_ids:
                        continue
                    
                    similarity = self._calculate_similarity(prospect, other_prospect)
                    
                    if similarity > self.similarity_threshold:
                        prospect_duplicates.append({
                            'index': j,
                            'prospect': other_prospect,
                            'similarity': similarity
                        })
                        processed_ids.add(j)
                
                if prospect_duplicates:
                    # This prospect has duplicates
                    duplicate_group = {
                        'master': {'index': i, 'prospect': prospect},
                        'duplicates': prospect_duplicates,
                        'total_count': len(prospect_duplicates) + 1
                    }
                    duplicates.append(duplicate_group)
                    
                    # Add the best version to unique list
                    best_prospect = self._select_best_prospect([prospect] + [d['prospect'] for d in prospect_duplicates])
                    unique_prospects.append(best_prospect)
                else:
                    # No duplicates, add to unique list
                    unique_prospects.append(prospect)
            
            return {
                'unique_prospects': unique_prospects,
                'duplicate_groups': duplicates,
                'original_count': len(prospects),
                'unique_count': len(unique_prospects),
                'duplicates_removed': len(prospects) - len(unique_prospects)
            }
            
        except Exception as e:
            logger.error(f"Error deduplicating prospect list: {str(e)}")
            return {
                'unique_prospects': prospects,
                'duplicate_groups': [],
                'error': str(e)
            }
    
    def merge_duplicate_prospects(self, master_prospect: Dict, duplicate_prospects: List[Dict]) -> Dict:
        """
        Merge duplicate prospects into a single, enhanced record
        
        Args:
            master_prospect: The primary prospect record
            duplicate_prospects: List of duplicate prospects to merge
            
        Returns:
            Dictionary with merged prospect data
        """
        try:
            merged = master_prospect.copy()
            
            # Merge strategy for different field types
            for duplicate in duplicate_prospects:
                # Company name: choose longer/more complete version
                if len(duplicate.get('company_name', '')) > len(merged.get('company_name', '')):
                    merged['company_name'] = duplicate['company_name']
                
                # Email: prefer non-generic emails
                if self._is_better_email(duplicate.get('email_address', ''), merged.get('email_address', '')):
                    merged['email_address'] = duplicate['email_address']
                
                # Phone: prefer formatted numbers
                if self._is_better_phone(duplicate.get('phone_number', ''), merged.get('phone_number', '')):
                    merged['phone_number'] = duplicate['phone_number']
                
                # Website: prefer HTTPS and complete URLs
                if self._is_better_website(duplicate.get('website', ''), merged.get('website', '')):
                    merged['website'] = duplicate['website']
                
                # Description: merge descriptions
                if duplicate.get('description') and duplicate['description'] not in merged.get('description', ''):
                    merged['description'] = f"{merged.get('description', '')} {duplicate['description']}".strip()
                
                # ICO: prefer non-empty
                if duplicate.get('ico') and not merged.get('ico'):
                    merged['ico'] = duplicate['ico']
                
                # Industry: prefer more specific
                if len(duplicate.get('industry', '')) > len(merged.get('industry', '')):
                    merged['industry'] = duplicate['industry']
                
                # Location: prefer more complete address
                if len(duplicate.get('location', '')) > len(merged.get('location', '')):
                    merged['location'] = duplicate['location']
            
            # Add merge metadata
            merged['_merge_info'] = {
                'merged_from': len(duplicate_prospects),
                'merge_date': str(timezone.now() if 'timezone' in globals() else 'N/A'),
                'merge_sources': [d.get('id') or d.get('company_name', 'Unknown') for d in duplicate_prospects]
            }
            
            return merged
            
        except Exception as e:
            logger.error(f"Error merging prospects: {str(e)}")
            return master_prospect
    
    def _get_existing_prospects(self, new_prospect: Dict, model_class=None, limit: int = 100) -> List[Dict]:
        """Get existing prospects for comparison"""
        try:
            if model_class:
                # Database query approach
                queryset = model_class.objects.filter(deleted=False)
                
                # Filter by company name similarity if available
                company_name = new_prospect.get('company_name', '')
                if company_name:
                    # Simple name-based filtering to reduce dataset
                    words = company_name.split()[:2]  # Use first 2 words
                    q_objects = Q()
                    for word in words:
                        if len(word) > 2:
                            q_objects |= Q(company_name__icontains=word)
                    
                    if q_objects:
                        queryset = queryset.filter(q_objects)
                
                # Convert to dictionaries
                prospects = []
                for prospect in queryset[:limit]:
                    prospects.append({
                        'id': str(prospect.id),
                        'company_name': prospect.company_name,
                        'email_address': prospect.email_address,
                        'phone_number': prospect.phone_number,
                        'website': prospect.website,
                        'location': prospect.location,
                        'ico': getattr(prospect, 'ico', ''),
                        'industry': getattr(prospect, 'industry', ''),
                        'description': getattr(prospect, 'description', '')
                    })
                
                return prospects
            else:
                # Cache-based approach (fallback)
                cache_key = "recent_prospects_for_dedup"
                cached_prospects = cache.get(cache_key, [])
                return cached_prospects[:limit]
                
        except Exception as e:
            logger.error(f"Error getting existing prospects: {str(e)}")
            return []
    
    def _fuzzy_match_prospects(self, new_prospect: Dict, existing_prospects: List[Dict]) -> Dict:
        """Perform fuzzy matching against existing prospects"""
        best_matches = []
        
        for existing in existing_prospects:
            similarity = self._calculate_similarity(new_prospect, existing)
            
            if similarity > 0.5:  # Only consider reasonable matches
                best_matches.append({
                    'prospect': existing,
                    'similarity': similarity,
                    'matching_fields': self._identify_matching_fields(new_prospect, existing)
                })
        
        # Sort by similarity
        best_matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        if best_matches:
            highest_similarity = best_matches[0]['similarity']
            
            return {
                'is_duplicate': highest_similarity > self.similarity_threshold,
                'confidence': int(highest_similarity * 100),
                'duplicates': best_matches[:3],  # Top 3 matches
                'method': 'fuzzy_matching'
            }
        
        return {
            'is_duplicate': False,
            'confidence': 0,
            'duplicates': [],
            'method': 'fuzzy_matching'
        }
    
    def _calculate_similarity(self, prospect1: Dict, prospect2: Dict) -> float:
        """Calculate overall similarity between two prospects"""
        try:
            email_sim = self._calculate_email_similarity(
                prospect1.get('email_address', ''),
                prospect2.get('email_address', '')
            )
            
            company_sim = self._calculate_string_similarity(
                prospect1.get('company_name', ''),
                prospect2.get('company_name', '')
            )
            
            phone_sim = self._calculate_phone_similarity(
                prospect1.get('phone_number', ''),
                prospect2.get('phone_number', '')
            )
            
            address_sim = self._calculate_string_similarity(
                prospect1.get('location', ''),
                prospect2.get('location', '')
            )
            
            # ICO match (exact match gives high score)
            ico_sim = 1.0 if (prospect1.get('ico') and prospect2.get('ico') and 
                             prospect1['ico'] == prospect2['ico']) else 0.0
            
            # Website similarity
            website_sim = self._calculate_website_similarity(
                prospect1.get('website', ''),
                prospect2.get('website', '')
            )
            
            # Weighted average
            total_similarity = (
                email_sim * self.email_weight +
                company_sim * self.company_weight +
                phone_sim * self.phone_weight +
                address_sim * self.address_weight +
                ico_sim * 0.3 +  # ICO gets high weight when available
                website_sim * 0.2
            ) / (self.email_weight + self.company_weight + self.phone_weight + 
                self.address_weight + 0.3 + 0.2)
            
            return min(total_similarity, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            return 0.0
    
    def _calculate_string_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using difflib"""
        if not str1 or not str2:
            return 0.0
        
        # Normalize strings
        str1_norm = self._normalize_string(str1)
        str2_norm = self._normalize_string(str2)
        
        if str1_norm == str2_norm:
            return 1.0
        
        # Use SequenceMatcher for similarity
        similarity = difflib.SequenceMatcher(None, str1_norm, str2_norm).ratio()
        
        # Also check if one string contains the other (useful for company names)
        if str1_norm in str2_norm or str2_norm in str1_norm:
            similarity = max(similarity, 0.8)
        
        return similarity
    
    def _calculate_email_similarity(self, email1: str, email2: str) -> float:
        """Calculate email similarity with special handling"""
        if not email1 or not email2:
            return 0.0
        
        if email1.lower() == email2.lower():
            return 1.0
        
        # Extract domains
        domain1 = email1.split('@')[-1].lower() if '@' in email1 else ''
        domain2 = email2.split('@')[-1].lower() if '@' in email2 else ''
        
        # Same domain gives high similarity
        if domain1 and domain2 and domain1 == domain2:
            return 0.8
        
        # Different domains
        return 0.0
    
    def _calculate_phone_similarity(self, phone1: str, phone2: str) -> float:
        """Calculate phone number similarity"""
        if not phone1 or not phone2:
            return 0.0
        
        # Normalize phone numbers (remove spaces, dashes, etc.)
        norm_phone1 = re.sub(r'[^\d+]', '', phone1)
        norm_phone2 = re.sub(r'[^\d+]', '', phone2)
        
        if norm_phone1 == norm_phone2:
            return 1.0
        
        # Check if one is a subset of the other (international vs local format)
        if len(norm_phone1) > 6 and len(norm_phone2) > 6:
            if norm_phone1 in norm_phone2 or norm_phone2 in norm_phone1:
                return 0.9
        
        return 0.0
    
    def _calculate_website_similarity(self, website1: str, website2: str) -> float:
        """Calculate website similarity"""
        if not website1 or not website2:
            return 0.0
        
        # Normalize URLs
        def normalize_url(url):
            url = url.lower().strip()
            # Remove protocol
            for protocol in ['https://', 'http://', 'www.']:
                if url.startswith(protocol):
                    url = url[len(protocol):]
            # Remove trailing slash
            return url.rstrip('/')
        
        norm_url1 = normalize_url(website1)
        norm_url2 = normalize_url(website2)
        
        if norm_url1 == norm_url2:
            return 1.0
        
        # Check domain similarity
        domain1 = norm_url1.split('/')[0]
        domain2 = norm_url2.split('/')[0]
        
        if domain1 == domain2:
            return 0.9
        
        return 0.0
    
    def _normalize_string(self, s: str) -> str:
        """Normalize string for comparison"""
        # Convert to lowercase
        s = s.lower().strip()
        
        # Remove common business suffixes
        business_suffixes = ['s.r.o.', 'a.s.', 'spol.', 'ltd.', 'inc.', 'corp.', 'o.p.s.']
        for suffix in business_suffixes:
            if s.endswith(suffix):
                s = s[:-len(suffix)].strip()
        
        # Remove extra whitespace
        s = re.sub(r'\s+', ' ', s)
        
        return s
    
    def _identify_matching_fields(self, prospect1: Dict, prospect2: Dict) -> List[str]:
        """Identify which fields match between two prospects"""
        matching_fields = []
        
        fields_to_check = ['company_name', 'email_address', 'phone_number', 'website', 'ico', 'location']
        
        for field in fields_to_check:
            val1 = prospect1.get(field, '')
            val2 = prospect2.get(field, '')
            
            if val1 and val2:
                if field == 'email_address':
                    if self._calculate_email_similarity(val1, val2) > 0.8:
                        matching_fields.append(field)
                elif field == 'phone_number':
                    if self._calculate_phone_similarity(val1, val2) > 0.8:
                        matching_fields.append(field)
                elif field == 'website':
                    if self._calculate_website_similarity(val1, val2) > 0.8:
                        matching_fields.append(field)
                else:
                    if self._calculate_string_similarity(val1, val2) > 0.8:
                        matching_fields.append(field)
        
        return matching_fields
    
    def _ai_duplicate_check(self, new_prospect: Dict, potential_duplicates: List[Dict]) -> Dict:
        """Use AI to verify potential duplicates"""
        try:
            # Prepare data for AI analysis
            candidates = [dup['prospect'] for dup in potential_duplicates[:3]]  # Top 3 candidates
            
            ai_result = ai_analysis_service.detect_duplicates(new_prospect, candidates)
            
            return {
                'is_duplicate': ai_result.get('is_duplicate', False),
                'confidence': ai_result.get('confidence', 0),
                'reasoning': ai_result.get('reasoning', ''),
                'method': 'ai_analysis'
            }
            
        except Exception as e:
            logger.error(f"Error in AI duplicate check: {str(e)}")
            return {
                'is_duplicate': False,
                'confidence': 0,
                'error': str(e),
                'method': 'ai_analysis_error'
            }
    
    def _combine_detection_results(self, fuzzy_results: Dict, ai_results: Dict) -> Dict:
        """Combine fuzzy matching and AI results"""
        try:
            # Weight the results
            fuzzy_weight = 0.6
            ai_weight = 0.4
            
            combined_confidence = (
                fuzzy_results.get('confidence', 0) * fuzzy_weight +
                ai_results.get('confidence', 0) * ai_weight
            )
            
            # Decision logic
            is_duplicate = (
                (fuzzy_results.get('is_duplicate', False) and fuzzy_results.get('confidence', 0) > 80) or
                (ai_results.get('is_duplicate', False) and ai_results.get('confidence', 0) > 70) or
                (combined_confidence > 75)
            )
            
            return {
                'is_duplicate': is_duplicate,
                'confidence': int(combined_confidence),
                'duplicates': fuzzy_results.get('duplicates', []),
                'method': 'combined_fuzzy_ai',
                'fuzzy_results': fuzzy_results,
                'ai_results': ai_results
            }
            
        except Exception as e:
            logger.error(f"Error combining detection results: {str(e)}")
            return fuzzy_results  # Fallback to fuzzy results
    
    def _select_best_prospect(self, prospects: List[Dict]) -> Dict:
        """Select the best prospect from a group of duplicates"""
        if not prospects:
            return {}
        
        if len(prospects) == 1:
            return prospects[0]
        
        # Score each prospect based on data completeness
        scored_prospects = []
        
        for prospect in prospects:
            score = 0
            
            # Score based on field completeness and quality
            if prospect.get('company_name'):
                score += 10
            if prospect.get('email_address') and '@' in prospect['email_address']:
                score += 15
            if prospect.get('phone_number'):
                score += 10
            if prospect.get('website'):
                score += 8
            if prospect.get('ico'):
                score += 12
            if prospect.get('industry'):
                score += 5
            if prospect.get('location'):
                score += 5
            if prospect.get('description'):
                score += len(prospect['description']) // 10  # Longer descriptions get more points
            
            # Penalty for generic emails
            email = prospect.get('email_address', '')
            if any(generic in email.lower() for generic in ['info@', 'contact@', 'admin@']):
                score -= 5
            
            scored_prospects.append((score, prospect))
        
        # Return the highest scoring prospect
        scored_prospects.sort(key=lambda x: x[0], reverse=True)
        return scored_prospects[0][1]
    
    def _is_better_email(self, email1: str, email2: str) -> bool:
        """Determine if email1 is better than email2"""
        if not email1:
            return False
        if not email2:
            return True
        
        # Prefer non-generic emails
        generic_prefixes = ['info@', 'contact@', 'admin@', 'office@']
        
        email1_generic = any(email1.lower().startswith(prefix) for prefix in generic_prefixes)
        email2_generic = any(email2.lower().startswith(prefix) for prefix in generic_prefixes)
        
        if email1_generic != email2_generic:
            return not email1_generic  # Prefer non-generic
        
        return len(email1) > len(email2)  # Prefer longer emails if both same type
    
    def _is_better_phone(self, phone1: str, phone2: str) -> bool:
        """Determine if phone1 is better than phone2"""
        if not phone1:
            return False
        if not phone2:
            return True
        
        # Prefer formatted numbers
        phone1_formatted = '+' in phone1 or '-' in phone1 or ' ' in phone1
        phone2_formatted = '+' in phone2 or '-' in phone2 or ' ' in phone2
        
        if phone1_formatted != phone2_formatted:
            return phone1_formatted
        
        return len(phone1) > len(phone2)
    
    def _is_better_website(self, website1: str, website2: str) -> bool:
        """Determine if website1 is better than website2"""
        if not website1:
            return False
        if not website2:
            return True
        
        # Prefer HTTPS
        if website1.startswith('https://') and not website2.startswith('https://'):
            return True
        if website2.startswith('https://') and not website1.startswith('https://'):
            return False
        
        # Prefer complete URLs
        return len(website1) > len(website2)


# Service instance
deduplication_service = DeduplicationService()