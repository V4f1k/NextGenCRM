"""
AI Analysis Service - OpenAI integration for data extraction and validation
Replaces N8N AI functionality with intelligent prospect analysis
"""

import logging
import json
import time
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
import openai

logger = logging.getLogger(__name__)


class AIAnalysisService:
    """OpenAI-powered AI analysis service for prospect data enhancement"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if self.api_key:
            openai.api_key = self.api_key
        else:
            logger.warning("OpenAI API key not configured. Set OPENAI_API_KEY in settings.")
        
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
        self.max_tokens = 1000
        self.temperature = 0.3  # Lower temperature for more consistent results
    
    def analyze_prospect_quality(self, prospect_data: Dict) -> Dict:
        """
        Analyze prospect quality and provide scoring
        
        Args:
            prospect_data: Dictionary with prospect information
            
        Returns:
            Dictionary with quality analysis and score
        """
        if not self.api_key:
            logger.error("OpenAI API key not configured")
            return {'error': 'AI service not available'}
        
        try:
            # Build analysis prompt
            prompt = self._build_prospect_analysis_prompt(prospect_data)
            
            # Get AI analysis
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Jsi expert na B2B lead kvalifikaci pro český trh. 
                        Analyzuješ firemní prospekty pro cold email kampaně.
                        Odpovídej vždy ve formátu JSON s českými komentáři."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            # Parse response
            content = response.choices[0].message.content.strip()
            analysis = self._parse_ai_response(content)
            
            logger.info(f"AI analysis completed for prospect: {prospect_data.get('company_name', 'Unknown')}")
            return analysis
            
        except Exception as e:
            logger.error(f"Error in AI prospect analysis: {str(e)}")
            return {'error': str(e), 'score': 0}
    
    def extract_contact_info(self, website_content: str, company_name: str) -> Dict:
        """
        Extract and validate contact information from website content
        
        Args:
            website_content: Raw website text content
            company_name: Company name for context
            
        Returns:
            Dictionary with extracted contact information
        """
        if not self.api_key:
            return {'error': 'AI service not available'}
        
        try:
            prompt = f"""
            Analyzuj následující obsah webové stránky společnosti "{company_name}" a extrahuj kontaktní informace.
            
            Obsah webu:
            {website_content[:3000]}  # Limit content length
            
            Vrať JSON s následujícími údaji:
            {{
                "emails": ["seznam emailových adres"],
                "phones": ["seznam telefonních čísel"],
                "addresses": ["seznam adres"],
                "contact_persons": [
                    {{
                        "name": "jméno osoby",
                        "position": "pozice",
                        "email": "email",
                        "phone": "telefon"
                    }}
                ],
                "confidence": "číslo 0-100 představující jistotu extrakce",
                "notes": "poznámky k nalezených informacím"
            }}
            
            Zaměř se na:
            - Validní česká telefonní čísla
            - Firemní emailové adresy (ne obecné info@)
            - Konkrétní kontaktní osoby s pozicemi
            - Správné adresy v českém formátu
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jsi expert na extrakci kontaktních informací z webových stránek českých firem."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.2
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Error extracting contact info: {str(e)}")
            return {'error': str(e)}
    
    def generate_prospect_summary(self, all_data: Dict) -> Dict:
        """
        Generate comprehensive prospect summary from all collected data
        
        Args:
            all_data: Combined data from maps, website, ARES, etc.
            
        Returns:
            Dictionary with prospect summary and recommendations
        """
        if not self.api_key:
            return {'error': 'AI service not available'}
        
        try:
            prompt = f"""
            Na základě všech dostupných dat vytvoř komprehenzivní shrnutí prospektu pro cold email kampaň.
            
            Data o společnosti:
            {json.dumps(all_data, ensure_ascii=False, indent=2)[:4000]}
            
            Vrať JSON s:
            {{
                "summary": "stručné shrnutí společnosti (2-3 věty)",
                "key_points": ["klíčové body pro cold email"],
                "target_contact": {{
                    "suggested_person": "doporučená kontaktní osoba",
                    "reason": "důvod výběru",
                    "approach": "doporučený přístup"
                }},
                "business_potential": {{
                    "score": "číslo 1-10",
                    "reasoning": "zdůvodnění hodnocení",
                    "estimated_value": "odhadovaná hodnota zakázky"
                }},
                "personalization_tips": ["tipy pro personalizaci emailu"],
                "red_flags": ["varování nebo rizika"],
                "next_steps": ["doporučené další kroky"]
            }}
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jsi B2B sales expert specializující se na český trh a cold email kampaně."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1200,
                temperature=0.4
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Error generating prospect summary: {str(e)}")
            return {'error': str(e)}
    
    def validate_email_content(self, email_content: str, prospect_data: Dict) -> Dict:
        """
        Validate and improve email content for Czech market
        
        Args:
            email_content: Generated email content
            prospect_data: Prospect information for context
            
        Returns:
            Dictionary with validation results and suggestions
        """
        if not self.api_key:
            return {'error': 'AI service not available'}
        
        try:
            prompt = f"""
            Zkontroluj následující cold email pro český trh a navrhni vylepšení.
            
            Email:
            {email_content}
            
            Kontext prospektu:
            - Společnost: {prospect_data.get('company_name', '')}
            - Odvětví: {prospect_data.get('industry', '')}
            - Lokace: {prospect_data.get('location', '')}
            
            Vrať JSON s:
            {{
                "overall_score": "celkové hodnocení 1-10",
                "strengths": ["silné stránky emailu"],
                "weaknesses": ["slabé stránky emailu"],
                "improvements": [
                    {{
                        "issue": "problém",
                        "suggestion": "návrh zlepšení",
                        "priority": "high/medium/low"
                    }}
                ],
                "czech_language_issues": ["problémy s češtinou"],
                "personalization_level": "low/medium/high",
                "spam_risk": "low/medium/high",
                "revised_email": "vylepšená verze emailu (pokud potřeba)",
                "send_recommendation": "ano/ne s důvodem"
            }}
            
            Zaměř se na:
            - Správnou češtinu a oslovení
            - Personalizaci pro konkrétní společnost
            - Hodnotu pro příjemce
            - Vhodnost pro český obchodní styl
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jsi expert na českou obchodní komunikaci a email marketing."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Error validating email content: {str(e)}")
            return {'error': str(e)}
    
    def detect_duplicates(self, prospect: Dict, existing_prospects: List[Dict]) -> Dict:
        """
        Use AI to detect potential duplicate prospects
        
        Args:
            prospect: New prospect data
            existing_prospects: List of existing prospects to check against
            
        Returns:
            Dictionary with duplicate detection results
        """
        if not self.api_key or not existing_prospects:
            return {'is_duplicate': False, 'confidence': 0}
        
        try:
            # Limit comparison to most recent/similar prospects
            candidates = existing_prospects[:20]  # Limit for API efficiency
            
            prompt = f"""
            Zkontroluj, zda následující nový prospect není duplikát existujících záznamů.
            
            Nový prospect:
            {json.dumps(prospect, ensure_ascii=False, indent=2)}
            
            Existující prospekti:
            {json.dumps(candidates, ensure_ascii=False, indent=2)[:3000]}
            
            Vrať JSON s:
            {{
                "is_duplicate": true/false,
                "confidence": "číslo 0-100",
                "duplicate_of": "ID nebo index duplikátu (pokud nalezen)",
                "reasoning": "zdůvodnění rozhodnutí",
                "differences": ["rozdíly mezi záznamy"],
                "recommendation": "doporučení (keep/merge/discard)"
            }}
            
            Porovnávej podle:
            - Název společnosti (i s drobnými odchylkami)
            - IČO (pokud dostupné)
            - Adresa nebo lokace
            - Kontaktní informace
            - Website
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jsi expert na deduplikaci firemních dat s důrazem na český trh."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=600,
                temperature=0.2
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Error in duplicate detection: {str(e)}")
            return {'is_duplicate': False, 'confidence': 0, 'error': str(e)}
    
    def analyze_industry_trends(self, industry: str, location: str) -> Dict:
        """
        Provide industry-specific insights for better targeting
        
        Args:
            industry: Industry sector
            location: Geographic location
            
        Returns:
            Dictionary with industry analysis
        """
        if not self.api_key:
            return {'error': 'AI service not available'}
        
        # Cache key for industry analysis
        cache_key = f"industry_analysis_{industry}_{location}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        try:
            prompt = f"""
            Poskytni analýzu odvětví "{industry}" v lokaci "{location}" pro B2B cold email kampaň.
            
            Vrať JSON s:
            {{
                "industry_overview": "přehled odvětví v ČR",
                "key_challenges": ["hlavní výzvy v odvětví"],
                "growth_trends": ["trendy růstu"],
                "typical_pain_points": ["typické problémy firem"],
                "decision_makers": ["kdo rozhoduje o nákupech"],
                "best_approach": "nejlepší přístup pro cold email",
                "seasonal_factors": ["sezónní faktory"],
                "competition_level": "low/medium/high",
                "avg_deal_size": "odhadovaná velikost zakázek",
                "sales_cycle": "délka prodejního cyklu",
                "key_messaging": ["klíčové zprávy pro toto odvětví"]
            }}
            
            Zaměř se na český trh a současné trendy.
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jsi B2B market research expert specializující se na český trh."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.4
            )
            
            content = response.choices[0].message.content.strip()
            analysis = self._parse_ai_response(content)
            
            # Cache for 24 hours
            cache.set(cache_key, analysis, 86400)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing industry trends: {str(e)}")
            return {'error': str(e)}
    
    def _build_prospect_analysis_prompt(self, prospect_data: Dict) -> str:
        """Build comprehensive prospect analysis prompt"""
        return f"""
        Analyzuj následující B2B prospect pro cold email kampaň v České republice.
        
        Data prospektu:
        - Název společnosti: {prospect_data.get('company_name', 'N/A')}
        - Odvětví: {prospect_data.get('industry', 'N/A')}
        - Lokace: {prospect_data.get('location', 'N/A')}
        - Website: {prospect_data.get('website', 'N/A')}
        - IČO: {prospect_data.get('ico', 'N/A')}
        - Kontaktní osoba: {prospect_data.get('contact_name', 'N/A')}
        - Email: {prospect_data.get('email_address', 'N/A')}
        - Telefon: {prospect_data.get('phone_number', 'N/A')}
        - Popis: {prospect_data.get('description', 'N/A')}
        
        Vrať JSON s následující analýzou:
        {{
            "quality_score": "číslo 0-100 (celkové hodnocení kvality)",
            "contact_quality": "číslo 0-100 (kvalita kontaktních údajů)",
            "business_potential": "číslo 0-100 (obchodní potenciál)",
            "data_completeness": "číslo 0-100 (úplnost dat)",
            "validation_status": "valid/invalid/needs_review",
            "strengths": ["silné stránky prospektu"],
            "weaknesses": ["slabé stránky nebo chybějící data"],
            "recommendations": ["doporučení pro zlepšení"],
            "target_persona": "typ osoby k oslovení (CEO, IT manažer, atd.)",
            "approach_strategy": "doporučená strategie oslovení",
            "urgency": "high/medium/low (priorita oslovení)",
            "estimated_deal_value": "odhad hodnoty potenciální zakázky v Kč",
            "red_flags": ["varování nebo rizikové faktory"],
            "next_actions": ["konkrétní další kroky"]
        }}
        
        Zaměř se na:
        - Kvalitu a úplnost kontaktních údajů
        - Vhodnost pro naše služby (marketing automation)
        - Potenciál pro obchodní spolupráci
        - Rizika nebo problémy
        """
    
    def _parse_ai_response(self, content: str) -> Dict:
        """Parse AI response, handling potential JSON issues"""
        try:
            # Try to find JSON in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_content = content[start_idx:end_idx]
                return json.loads(json_content)
            else:
                # Fallback: return as text if no JSON found
                return {'analysis': content, 'format': 'text'}
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI JSON response: {str(e)}")
            return {'error': 'Invalid JSON response', 'raw_content': content}
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return {'error': str(e), 'raw_content': content}


# Service instance
ai_analysis_service = AIAnalysisService()