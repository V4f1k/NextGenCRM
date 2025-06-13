"""
Website scraping service for content extraction and analysis
Replaces N8N scraping functionality
"""

import logging
import requests
import re
import time
from typing import Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup, Tag
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class WebScrapingService:
    """Website content extraction and analysis service"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'cs,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        self.timeout = 30
        self.max_retries = 3
    
    def analyze_website(self, url: str) -> Dict:
        """
        Comprehensive website analysis
        
        Args:
            url: Website URL to analyze
            
        Returns:
            Dictionary with extracted website information
        """
        if not url:
            return {}
        
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        
        # Cache key
        cache_key = f"website_analysis_{url}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached website analysis for: {url}")
            return cached_result
        
        try:
            # Fetch website content
            soup = self._fetch_page(url)
            if not soup:
                return {'url': url, 'accessible': False, 'error': 'Failed to fetch content'}
            
            # Extract comprehensive information
            analysis = {
                'url': url,
                'accessible': True,
                'title': self._extract_title(soup),
                'description': self._extract_description(soup),
                'language': self._detect_language(soup),
                'contact_info': self._extract_contact_info(soup),
                'business_info': self._extract_business_info(soup),
                'services': self._extract_services(soup),
                'social_media': self._extract_social_media(soup),
                'technologies': self._detect_technologies(soup),
                'content_quality': self._assess_content_quality(soup),
                'seo_data': self._extract_seo_data(soup),
                'images': self._extract_images(soup, url),
                'last_updated': self._detect_last_updated(soup)
            }
            
            # Cache for 24 hours
            cache.set(cache_key, analysis, 86400)
            
            logger.info(f"Successfully analyzed website: {url}")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing website {url}: {str(e)}")
            return {'url': url, 'accessible': False, 'error': str(e)}
    
    def extract_contact_info(self, url: str) -> Dict:
        """
        Extract contact information from website
        
        Args:
            url: Website URL
            
        Returns:
            Dictionary with contact information
        """
        try:
            soup = self._fetch_page(url)
            if not soup:
                return {}
            
            contact_info = self._extract_contact_info(soup)
            
            # Try to find contact page
            contact_page_url = self._find_contact_page(soup, url)
            if contact_page_url and contact_page_url != url:
                contact_soup = self._fetch_page(contact_page_url)
                if contact_soup:
                    contact_page_info = self._extract_contact_info(contact_soup)
                    # Merge contact information, preferring contact page data
                    contact_info.update(contact_page_info)
            
            return contact_info
            
        except Exception as e:
            logger.error(f"Error extracting contact info from {url}: {str(e)}")
            return {}
    
    def find_key_personnel(self, url: str) -> List[Dict]:
        """
        Find key personnel information (CEO, directors, etc.)
        
        Args:
            url: Website URL
            
        Returns:
            List of personnel dictionaries
        """
        try:
            soup = self._fetch_page(url)
            if not soup:
                return []
            
            personnel = []
            
            # Look for about/team pages
            team_pages = self._find_team_pages(soup, url)
            
            for page_url in [url] + team_pages:
                page_soup = self._fetch_page(page_url) if page_url != url else soup
                if page_soup:
                    page_personnel = self._extract_personnel(page_soup)
                    personnel.extend(page_personnel)
            
            # Remove duplicates and rank by importance
            return self._rank_personnel(personnel)
            
        except Exception as e:
            logger.error(f"Error finding personnel from {url}: {str(e)}")
            return []
    
    def _fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse webpage content"""
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                
                # Check content type
                content_type = response.headers.get('content-type', '').lower()
                if 'text/html' not in content_type:
                    logger.warning(f"Non-HTML content type: {content_type}")
                    return None
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                
        return None
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()
        
        # Fallback to h1
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text().strip()
        
        return ""
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract page description"""
        # Try meta description first
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content'].strip()
        
        # Try Open Graph description
        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()
        
        # Extract from first paragraph
        first_p = soup.find('p')
        if first_p:
            text = first_p.get_text().strip()
            if len(text) > 50:
                return text[:300] + "..." if len(text) > 300 else text
        
        return ""
    
    def _detect_language(self, soup: BeautifulSoup) -> str:
        """Detect page language"""
        # Check html lang attribute
        html_tag = soup.find('html')
        if html_tag and html_tag.get('lang'):
            return html_tag['lang'][:2].lower()
        
        # Check meta language
        meta_lang = soup.find('meta', attrs={'http-equiv': 'content-language'})
        if meta_lang and meta_lang.get('content'):
            return meta_lang['content'][:2].lower()
        
        # Simple text analysis for Czech
        text = soup.get_text().lower()
        czech_indicators = ['ř', 'ž', 'ť', 'ď', 'ň', 'ě', 'š', 'č', 'ý', 'á', 'í', 'é', 'ú', 'ů']
        czech_words = ['společnost', 'kontakt', 'služby', 'o nás', 'domů', 'česká', 'praha']
        
        czech_score = sum(1 for char in czech_indicators if char in text)
        czech_score += sum(3 for word in czech_words if word in text)
        
        return 'cs' if czech_score > 5 else 'en'
    
    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict:
        """Extract contact information from page"""
        contact_info = {
            'emails': set(),
            'phones': set(),
            'addresses': set(),
            'social_media': {}
        }
        
        text = soup.get_text()
        
        # Extract emails
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        for email in emails:
            if not email.endswith(('.png', '.jpg', '.gif')):  # Skip image filenames
                contact_info['emails'].add(email.lower())
        
        # Extract phone numbers (Czech format)
        phone_patterns = [
            r'\+420\s*\d{3}\s*\d{3}\s*\d{3}',  # +420 xxx xxx xxx
            r'\+420\s*\d{9}',                   # +420xxxxxxxxx
            r'\d{3}\s*\d{3}\s*\d{3}',          # xxx xxx xxx
            r'\d{9}'                            # xxxxxxxxx
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            for phone in phones:
                cleaned_phone = re.sub(r'\s+', '', phone)
                if len(cleaned_phone) >= 9:
                    contact_info['phones'].add(cleaned_phone)
        
        # Extract addresses (Czech format)
        # Look for street patterns
        street_pattern = r'[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+\d+[a-z]?/?[\d\w]*'
        addresses = re.findall(street_pattern, text)
        for address in addresses:
            if len(address.split()) >= 2:  # At least street name + number
                contact_info['addresses'].add(address.strip())
        
        # Convert sets to lists for JSON serialization
        return {
            'emails': list(contact_info['emails'])[:5],  # Limit to 5 emails
            'phones': list(contact_info['phones'])[:3],   # Limit to 3 phones
            'addresses': list(contact_info['addresses'])[:3]  # Limit to 3 addresses
        }
    
    def _extract_business_info(self, soup: BeautifulSoup) -> Dict:
        """Extract business-related information"""
        business_info = {}
        
        # Extract ICO (Czech business ID)
        text = soup.get_text()
        ico_pattern = r'IČO?[::\s]*(\d{8})'
        ico_match = re.search(ico_pattern, text, re.IGNORECASE)
        if ico_match:
            business_info['ico'] = ico_match.group(1)
        
        # Extract DIC (Czech tax ID)
        dic_pattern = r'DIČ[::\s]*(CZ\d{8,10})'
        dic_match = re.search(dic_pattern, text, re.IGNORECASE)
        if dic_match:
            business_info['dic'] = dic_match.group(1)
        
        # Extract business registration info
        reg_patterns = [
            r'zapsaná?\s+v\s+obchodním\s+rejstříku\s+([^,.\n]+)',
            r'spisová\s+značka[::\s]*([A-Z]\s*\d+[^,.\n]*)'
        ]
        
        for pattern in reg_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                business_info['registration'] = match.group(1).strip()
                break
        
        return business_info
    
    def _extract_services(self, soup: BeautifulSoup) -> List[str]:
        """Extract services/products offered"""
        services = set()
        
        # Look for service-related sections
        service_sections = soup.find_all(['div', 'section'], 
                                       class_=re.compile(r'service|product|offer', re.I))
        
        for section in service_sections:
            # Extract text from headers and lists
            headers = section.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for header in headers:
                text = header.get_text().strip()
                if len(text) > 3 and len(text) < 100:
                    services.add(text)
            
            # Extract from lists
            lists = section.find_all(['ul', 'ol'])
            for ul in lists:
                items = ul.find_all('li')
                for item in items:
                    text = item.get_text().strip()
                    if len(text) > 3 and len(text) < 100:
                        services.add(text)
        
        return list(services)[:10]  # Limit to 10 services
    
    def _extract_social_media(self, soup: BeautifulSoup) -> Dict:
        """Extract social media links"""
        social_media = {}
        
        # Social media domains
        social_domains = {
            'facebook.com': 'facebook',
            'instagram.com': 'instagram',
            'linkedin.com': 'linkedin',
            'twitter.com': 'twitter',
            'youtube.com': 'youtube'
        }
        
        # Find all links
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            for domain, platform in social_domains.items():
                if domain in href:
                    social_media[platform] = href
                    break
        
        return social_media
    
    def _detect_technologies(self, soup: BeautifulSoup) -> List[str]:
        """Detect technologies used on the website"""
        technologies = set()
        
        # Check meta tags
        generator = soup.find('meta', attrs={'name': 'generator'})
        if generator and generator.get('content'):
            technologies.add(generator['content'])
        
        # Check for common CMS/framework indicators
        if soup.find('meta', attrs={'name': 'generator', 'content': re.compile(r'WordPress', re.I)}):
            technologies.add('WordPress')
        
        if soup.find(id=re.compile(r'drupal', re.I)) or soup.find(class_=re.compile(r'drupal', re.I)):
            technologies.add('Drupal')
        
        # Check scripts for common frameworks
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            src = script['src'].lower()
            if 'jquery' in src:
                technologies.add('jQuery')
            elif 'bootstrap' in src:
                technologies.add('Bootstrap')
            elif 'react' in src:
                technologies.add('React')
            elif 'vue' in src:
                technologies.add('Vue.js')
        
        return list(technologies)
    
    def _assess_content_quality(self, soup: BeautifulSoup) -> Dict:
        """Assess overall content quality"""
        text = soup.get_text()
        
        return {
            'word_count': len(text.split()),
            'has_contact_info': bool(re.search(r'@|\+420|\d{9}', text)),
            'has_business_info': bool(re.search(r'IČO|DIČ', text, re.I)),
            'last_updated': self._detect_last_updated(soup),
            'language_quality': 'czech' if re.search(r'[řžťďňěšč]', text) else 'other'
        }
    
    def _extract_seo_data(self, soup: BeautifulSoup) -> Dict:
        """Extract SEO-related data"""
        seo_data = {}
        
        # Meta keywords
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords and meta_keywords.get('content'):
            seo_data['keywords'] = meta_keywords['content']
        
        # Canonical URL
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        if canonical and canonical.get('href'):
            seo_data['canonical'] = canonical['href']
        
        # Open Graph data
        og_tags = soup.find_all('meta', attrs={'property': re.compile(r'^og:')})
        seo_data['open_graph'] = {}
        for tag in og_tags:
            property_name = tag.get('property', '').replace('og:', '')
            content = tag.get('content', '')
            if property_name and content:
                seo_data['open_graph'][property_name] = content
        
        return seo_data
    
    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract image URLs"""
        images = []
        img_tags = soup.find_all('img', src=True)
        
        for img in img_tags[:5]:  # Limit to 5 images
            src = img['src']
            # Convert relative URLs to absolute
            if src.startswith('/'):
                src = urljoin(base_url, src)
            elif not src.startswith(('http://', 'https://')):
                src = urljoin(base_url, src)
            
            images.append(src)
        
        return images
    
    def _detect_last_updated(self, soup: BeautifulSoup) -> Optional[str]:
        """Try to detect when the page was last updated"""
        # Look for common date patterns
        text = soup.get_text()
        
        # Czech date patterns
        date_patterns = [
            r'aktualizováno[::\s]*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})',
            r'poslední\s+aktualizace[::\s]*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})',
            r'(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _find_contact_page(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Find contact page URL"""
        contact_keywords = ['kontakt', 'contact', 'kontakty', 'spojení']
        
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href'].lower()
            text = link.get_text().lower()
            
            if any(keyword in href or keyword in text for keyword in contact_keywords):
                if href.startswith('/'):
                    return urljoin(base_url, href)
                elif href.startswith(('http://', 'https://')):
                    return href
        
        return None
    
    def _find_team_pages(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Find team/about pages"""
        team_keywords = ['tým', 'team', 'o nás', 'about', 'management', 'vedení']
        team_pages = []
        
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href'].lower()
            text = link.get_text().lower()
            
            if any(keyword in href or keyword in text for keyword in team_keywords):
                if href.startswith('/'):
                    page_url = urljoin(base_url, href)
                elif href.startswith(('http://', 'https://')):
                    page_url = href
                else:
                    continue
                
                if page_url not in team_pages:
                    team_pages.append(page_url)
        
        return team_pages[:3]  # Limit to 3 pages
    
    def _extract_personnel(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract personnel information from page"""
        personnel = []
        
        # Look for common personnel patterns
        text = soup.get_text()
        
        # Czech titles and positions
        title_patterns = [
            r'(jednatel[ka]?|ředitel[ka]?|CEO|CFO|CTO|majitel[ka]?|vlastník[číce]?|partner[ka]?)\s*:?\s*([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+)',
            r'([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+)\s*[-–—]\s*(jednatel[ka]?|ředitel[ka]?|CEO|CFO|CTO|majitel[ka]?)',
        ]
        
        for pattern in title_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.groups()) == 2:
                    title, name = match.groups()
                    personnel.append({
                        'name': name.strip(),
                        'title': title.strip(),
                        'source': 'website_text'
                    })
        
        return personnel
    
    def _rank_personnel(self, personnel: List[Dict]) -> List[Dict]:
        """Rank personnel by importance and remove duplicates"""
        # Remove duplicates based on name similarity
        unique_personnel = []
        seen_names = set()
        
        for person in personnel:
            name_key = person['name'].lower().replace(' ', '')
            if name_key not in seen_names:
                seen_names.add(name_key)
                unique_personnel.append(person)
        
        # Rank by title importance
        title_importance = {
            'ceo': 10,
            'jednatel': 9,
            'ředitel': 8,
            'majitel': 8,
            'vlastník': 7,
            'cfo': 6,
            'cto': 6,
            'partner': 5
        }
        
        def get_importance(person):
            title = person['title'].lower()
            for key, value in title_importance.items():
                if key in title:
                    return value
            return 1
        
        unique_personnel.sort(key=get_importance, reverse=True)
        return unique_personnel[:5]  # Return top 5


# Service instance
scraping_service = WebScrapingService()