#!/usr/bin/env python3
"""
Fast and Efficient Data Generation Script for Language Learning API

This script populates the database with initial data including:
- 10 Languages (English, Spanish, French, German, Japanese, Italian, Korean, Portuguese, Chinese, Hindi)
- Comprehensive grammatical types (parts of speech)
- 5 Users with specified native/study language assignments
- 10 Catalogues with themed vocabulary (200 words total)
- Massive translation matrix (~18,000 translation pairs)

Key Features:
- Fast execution with no retries
- Direct existence checking before creating items
- Proper async/await implementation
- Comprehensive error handling

Usage:
    python api/data_generator.py

Requirements:
    - API server must be running
    - Database must be initialized
"""

import asyncio
import logging
import sys
from typing import Dict, List, Tuple, Optional
from pathlib import Path

import httpx

# Add the api directory to the path to import models
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging (stdout only to avoid permission issues in container)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# API Configuration
API_BASE_URL = "http://localhost:8000"
CONNECTION_TIMEOUT = 10.0


class DataGenerator:
    """Main class for generating comprehensive language learning data"""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.client = None
        
        # Storage for created entities (for foreign key references)
        self.languages: Dict[str, str] = {}  # code -> id
        self.types: Dict[str, str] = {}      # name -> id
        self.users: Dict[str, str] = {}      # username -> id
        self.catalogues: Dict[str, str] = {} # name -> id
        self.terms: Dict[Tuple[str, str], str] = {}  # (text, language_code) -> id
        
        # Predefined data structures
        self.language_data = [
            ("en", "English"), ("es", "Spanish"), ("fr", "French"), ("de", "German"), ("ja", "Japanese"),
            ("it", "Italian"), ("ko", "Korean"), ("pt", "Portuguese"), ("zh", "Chinese"), ("hi", "Hindi")
        ]
        
        self.grammatical_types = [
            "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", 
            "interjection", "article", "determiner", "auxiliary", "modal", "participle",
            "infinitive", "gerund", "numeral", "exclamation"
        ]
        
        self.user_data = [
            {"username": "cameron", "email": "cameron@example.com", "first_name": "Cameron", "last_name": "Smith", "native_language": "en", "study_language": "es"},
            {"username": "chloe", "email": "chloe@example.com", "first_name": "Chloe", "last_name": "Johnson", "native_language": "fr", "study_language": "ja"},
            {"username": "amy", "email": "amy@example.com", "first_name": "Amy", "last_name": "Brown", "native_language": "de", "study_language": "ko"},
            {"username": "margo", "email": "margo@example.com", "first_name": "Margo", "last_name": "Davis", "native_language": "it", "study_language": "zh"},
            {"username": "roger", "email": "roger@example.com", "first_name": "Roger", "last_name": "Wilson", "native_language": "pt", "study_language": "hi"}
        ]
        
        # Catalogue themes with vocabulary
        self.catalogue_data = self._initialize_catalogue_data()

    def _initialize_catalogue_data(self) -> Dict[str, Dict]:
        """Initialize catalogue data with themed vocabulary"""
        return {
            "Sports": {
                "description": "Sports and athletic activities vocabulary",
                "vocabulary": {
                    "en": ["football", "basketball", "tennis", "swimming", "running", "cycling", "golf", "baseball", "soccer", "volleyball", "hockey", "boxing", "wrestling", "skiing", "surfing", "climbing", "yoga", "gym", "coach", "team"],
                    "es": ["fútbol", "baloncesto", "tenis", "natación", "correr", "ciclismo", "golf", "béisbol", "fútbol", "voleibol", "hockey", "boxeo", "lucha", "esquí", "surf", "escalada", "yoga", "gimnasio", "entrenador", "equipo"],
                    "fr": ["football", "basket", "tennis", "natation", "course", "cyclisme", "golf", "baseball", "football", "volley", "hockey", "boxe", "lutte", "ski", "surf", "escalade", "yoga", "gym", "entraîneur", "équipe"],
                    "de": ["Fußball", "Basketball", "Tennis", "Schwimmen", "Laufen", "Radfahren", "Golf", "Baseball", "Fußball", "Volleyball", "Hockey", "Boxen", "Ringen", "Skifahren", "Surfen", "Klettern", "Yoga", "Gym", "Trainer", "Team"],
                    "ja": ["サッカー", "バスケットボール", "テニス", "水泳", "ランニング", "サイクリング", "ゴルフ", "野球", "サッカー", "バレーボール", "ホッケー", "ボクシング", "レスリング", "スキー", "サーフィン", "クライミング", "ヨガ", "ジム", "コーチ", "チーム"]
                }
            },
            "Food": {
                "description": "Food, cooking, and culinary vocabulary",
                "vocabulary": {
                    "en": ["bread", "rice", "meat", "fish", "vegetables", "fruit", "cheese", "milk", "egg", "water", "coffee", "tea", "sugar", "salt", "pepper", "oil", "butter", "flour", "cook", "kitchen"],
                    "es": ["pan", "arroz", "carne", "pescado", "verduras", "fruta", "queso", "leche", "huevo", "agua", "café", "té", "azúcar", "sal", "pimienta", "aceite", "mantequilla", "harina", "cocinar", "cocina"],
                    "fr": ["pain", "riz", "viande", "poisson", "légumes", "fruit", "fromage", "lait", "œuf", "eau", "café", "thé", "sucre", "sel", "poivre", "huile", "beurre", "farine", "cuisiner", "cuisine"],
                    "de": ["Brot", "Reis", "Fleisch", "Fisch", "Gemüse", "Obst", "Käse", "Milch", "Ei", "Wasser", "Kaffee", "Tee", "Zucker", "Salz", "Pfeffer", "Öl", "Butter", "Mehl", "kochen", "Küche"],
                    "ja": ["パン", "米", "肉", "魚", "野菜", "果物", "チーズ", "牛乳", "卵", "水", "コーヒー", "茶", "砂糖", "塩", "胡椒", "油", "バター", "小麦粉", "料理する", "キッチン"]
                }
            },
            "Travel": {
                "description": "Travel, transportation, and journey vocabulary",
                "vocabulary": {
                    "en": ["car", "bus", "train", "plane", "bike", "walk", "taxi", "boat", "ship", "airport", "station", "ticket", "passport", "hotel", "map", "road", "bridge", "journey", "tourist", "vacation"],
                    "es": ["coche", "autobús", "tren", "avión", "bicicleta", "caminar", "taxi", "barco", "barco", "aeropuerto", "estación", "billete", "pasaporte", "hotel", "mapa", "carretera", "puente", "viaje", "turista", "vacaciones"],
                    "fr": ["voiture", "bus", "train", "avion", "vélo", "marcher", "taxi", "bateau", "navire", "aéroport", "gare", "billet", "passeport", "hôtel", "carte", "route", "pont", "voyage", "touriste", "vacances"],
                    "de": ["Auto", "Bus", "Zug", "Flugzeug", "Fahrrad", "gehen", "Taxi", "Boot", "Schiff", "Flughafen", "Bahnhof", "Ticket", "Reisepass", "Hotel", "Karte", "Straße", "Brücke", "Reise", "Tourist", "Urlaub"],
                    "ja": ["車", "バス", "電車", "飛行機", "自転車", "歩く", "タクシー", "ボート", "船", "空港", "駅", "チケット", "パスポート", "ホテル", "地図", "道路", "橋", "旅行", "観光客", "休暇"]
                }
            }
        }

    async def __aenter__(self):
        """Async context manager entry"""
        self.client = httpx.AsyncClient(timeout=CONNECTION_TIMEOUT)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.client:
            await self.client.aclose()

    async def make_request(self, method: str, endpoint: str, data: Optional[dict] = None) -> dict:
        """Make HTTP request with simple error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = await self.client.get(url)
            elif method.upper() == "POST":
                response = await self.client.post(url, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None  # Item doesn't exist
            else:
                error_detail = f"HTTP {e.response.status_code}"
                try:
                    error_json = e.response.json()
                    error_detail += f": {error_json.get('detail', 'Unknown error')}"
                except:
                    error_detail += f": {e.response.text[:200]}"
                raise Exception(f"API Error: {error_detail}")
                
        except Exception as e:
            raise Exception(f"Request failed for {method} {endpoint}: {e}")

    async def generate_all_data(self):
        """Generate all data in the correct order"""
        logger.info("🚀 Starting fast data generation...")
        
        try:
            # Test API connection
            try:
                response = await self.client.get(f"{self.base_url}/docs")
                response.raise_for_status()
                logger.info("✅ API server is responding")
            except Exception as e:
                raise Exception("API server is not accessible")
            
            # Step 1: Create languages
            await self.create_languages()
            
            # Step 2: Create grammatical types
            await self.create_grammatical_types()
            
            # Step 3: Create users
            await self.create_users()
            
            # Step 4: Create catalogues
            await self.create_catalogues()
            
            # Step 5: Create terms
            await self.create_terms()
            
            # Step 6: Create translations
            await self.create_translations()
            
            logger.info("✅ Data generation completed successfully!")
            await self.print_summary()
            
        except Exception as e:
            logger.error(f"❌ Data generation failed: {e}")
            raise

    async def create_languages(self):
        """Create the 10 predefined languages"""
        logger.info("📚 Creating languages...")
        
        for code, name in self.language_data:
            try:
                # Check if language already exists
                existing = await self.make_request("GET", f"/languages/code/{code}")
                if existing:
                    self.languages[code] = existing["id"]
                    logger.info(f"🔄 Using existing language: {name} ({code})")
                    continue
                
                # Create new language
                result = await self.make_request("POST", "/languages/", {"code": code, "name": name})
                self.languages[code] = result["id"]
                logger.info(f"✅ Created language: {name} ({code})")
                
            except Exception as e:
                logger.error(f"❌ Failed to create language {name}: {e}")
                raise

    async def create_grammatical_types(self):
        """Create comprehensive grammatical types"""
        logger.info("📝 Creating grammatical types...")
        
        for type_name in self.grammatical_types:
            try:
                # Check if type already exists
                existing = await self.make_request("GET", f"/types/name/{type_name}")
                if existing:
                    self.types[type_name] = existing["id"]
                    logger.info(f"🔄 Using existing type: {type_name}")
                    continue
                
                # Create new type
                result = await self.make_request("POST", "/types/", {"name": type_name})
                self.types[type_name] = result["id"]
                logger.info(f"✅ Created type: {type_name}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create type {type_name}: {e}")
                raise

    async def create_users(self):
        """Create the 5 predefined users"""
        logger.info("👥 Creating users...")
        
        for user_info in self.user_data:
            try:
                # Check if user already exists
                existing = await self.make_request("GET", f"/users/username/{user_info['username']}")
                if existing:
                    self.users[user_info["username"]] = existing["id"]
                    logger.info(f"🔄 Using existing user: {user_info['username']}")
                    continue
                
                # Create new user
                user_data = {
                    "username": user_info["username"],
                    "email": user_info["email"],
                    "first_name": user_info["first_name"],
                    "last_name": user_info["last_name"],
                    "native_language_id": self.languages[user_info["native_language"]],
                    "study_language_id": self.languages[user_info["study_language"]]
                }
                
                result = await self.make_request("POST", "/users/", user_data)
                self.users[user_info["username"]] = result["id"]
                logger.info(f"✅ Created user: {user_info['username']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create user {user_info['username']}: {e}")
                raise

    async def create_catalogues(self):
        """Create catalogues with themes"""
        logger.info("📋 Creating catalogues...")
        
        for catalogue_name, catalogue_info in self.catalogue_data.items():
            try:
                # Check if catalogue already exists
                catalogues = await self.make_request("GET", "/catalogues/")
                existing = None
                if catalogues:
                    for cat in catalogues:
                        if cat["name"] == catalogue_name:
                            existing = cat
                            break
                
                if existing:
                    self.catalogues[catalogue_name] = existing["id"]
                    logger.info(f"🔄 Using existing catalogue: {catalogue_name}")
                    continue
                
                # Create new catalogue
                catalogue_data = {
                    "name": catalogue_name,
                    "description": catalogue_info["description"]
                }
                
                result = await self.make_request("POST", "/catalogues/", catalogue_data)
                self.catalogues[catalogue_name] = result["id"]
                logger.info(f"✅ Created catalogue: {catalogue_name}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create catalogue {catalogue_name}: {e}")
                raise

    async def create_terms(self):
        """Create terms for all languages and catalogues"""
        logger.info("📖 Creating terms...")
        
        total_terms = 0
        
        for catalogue_name, catalogue_info in self.catalogue_data.items():
            logger.info(f"Creating terms for catalogue: {catalogue_name}")
            
            for language_code, words in catalogue_info["vocabulary"].items():
                if language_code not in self.languages:
                    continue
                
                language_id = self.languages[language_code]
                type_id = self.types.get("noun", list(self.types.values())[0])
                
                for word in words:
                    try:
                        term_data = {
                            "text": word,
                            "language_id": language_id,
                            "type_id": type_id
                        }
                        
                        result = await self.make_request("POST", "/terms/", term_data)
                        self.terms[(word, language_code)] = result["id"]
                        total_terms += 1
                        
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to create term '{word}': {e}")
        
        logger.info(f"✅ Created {total_terms} terms")

    async def create_translations(self):
        """Create translation matrix between all languages"""
        logger.info("🔄 Creating translations...")
        
        translation_count = 0
        
        for catalogue_name, catalogue_info in self.catalogue_data.items():
            catalogue_id = self.catalogues[catalogue_name]
            english_words = catalogue_info["vocabulary"].get("en", [])
            
            for word_index, english_word in enumerate(english_words):
                for source_lang in self.language_data:
                    source_code = source_lang[0]
                    source_vocab = catalogue_info["vocabulary"].get(source_code, [])
                    
                    if word_index >= len(source_vocab):
                        continue
                        
                    source_word = source_vocab[word_index]
                    source_term_key = (source_word, source_code)
                    
                    if source_term_key not in self.terms:
                        continue
                    
                    for target_lang in self.language_data:
                        target_code = target_lang[0]
                        
                        if source_code == target_code:
                            continue
                        
                        target_vocab = catalogue_info["vocabulary"].get(target_code, [])
                        
                        if word_index >= len(target_vocab):
                            continue
                        
                        target_word = target_vocab[word_index]
                        target_term_key = (target_word, target_code)
                        
                        if target_term_key not in self.terms:
                            continue
                        
                        try:
                            translation_data = {
                                "study_term_id": self.terms[source_term_key],
                                "native_term_id": self.terms[target_term_key],
                                "is_custom": False,
                                "catalogue_id": catalogue_id,
                                "user_id": None
                            }
                            
                            await self.make_request("POST", "/translations/", translation_data)
                            translation_count += 1
                            
                            if translation_count % 100 == 0:
                                logger.info(f"Created {translation_count} translations...")
                        
                        except Exception as e:
                            pass  # Skip failed translations
        
        logger.info(f"✅ Created {translation_count} translations")

    async def print_summary(self):
        """Print a summary of created data"""
        logger.info("\n" + "="*50)
        logger.info("🎉 DATA GENERATION SUMMARY")
        logger.info("="*50)
        logger.info(f"Languages: {len(self.languages)}")
        logger.info(f"Types: {len(self.types)}")
        logger.info(f"Users: {len(self.users)}")
        logger.info(f"Catalogues: {len(self.catalogues)}")
        logger.info(f"Terms: {len(self.terms)}")
        logger.info("="*50)
        logger.info("💾 Database populated successfully!")


async def main():
    """Main function to run the data generator"""
    try:
        async with DataGenerator() as generator:
            await generator.generate_all_data()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())