#!/usr/bin/env python3
"""
JANMITRA AI Services - Complaint Categorization
Simple rule-based categorization system for civic complaints
"""

import re
from typing import Dict, List, Tuple

class ComplaintCategorizer:
    def __init__(self):
        # Define category keywords and patterns
        self.category_patterns = {
            'roads': {
                'keywords': ['pothole', 'road', 'street', 'asphalt', 'crack', 'damage', 'vehicle', 'traffic', 'speed bump', 'roadblock'],
                'patterns': [r'pothole', r'road.*damage', r'street.*crack', r'asphalt.*problem']
            },
            'sanitation': {
                'keywords': ['garbage', 'waste', 'trash', 'drain', 'sewer', 'clean', 'dirty', 'smell', 'collection', 'bin'],
                'patterns': [r'garbage.*not.*collect', r'waste.*accumulat', r'drain.*block', r'sewer.*overflow']
            },
            'electric': {
                'keywords': ['electricity', 'power', 'light', 'wire', 'pole', 'outage', 'fault', 'shock', 'voltage', 'transformer'],
                'patterns': [r'power.*cut', r'light.*not.*work', r'electric.*fault', r'wire.*hang']
            },
            'water': {
                'keywords': ['water', 'supply', 'pipe', 'leak', 'pressure', 'shortage', 'quality', 'tank', 'pump', 'connection'],
                'patterns': [r'water.*supply', r'pipe.*leak', r'water.*pressure', r'water.*quality']
            },
            'parks': {
                'keywords': ['park', 'garden', 'tree', 'playground', 'bench', 'grass', 'maintenance', 'green', 'recreation'],
                'patterns': [r'park.*maintenance', r'garden.*not.*clean', r'tree.*fall', r'playground.*damage']
            },
            'traffic': {
                'keywords': ['traffic', 'signal', 'sign', 'parking', 'violation', 'congestion', 'accident', 'speed', 'lane'],
                'patterns': [r'traffic.*signal', r'parking.*problem', r'traffic.*jam', r'speed.*limit']
            }
        }
    
    def categorize(self, description: str) -> Tuple[str, float]:
        """
        Categorize a complaint description
        Returns: (category, confidence_score)
        """
        description_lower = description.lower()
        
        category_scores = {}
        
        for category, config in self.category_patterns.items():
            score = 0
            
            # Check keywords
            for keyword in config['keywords']:
                if keyword in description_lower:
                    score += 1
            
            # Check patterns
            for pattern in config['patterns']:
                if re.search(pattern, description_lower):
                    score += 2
            
            category_scores[category] = score
        
        # Find best category
        if not category_scores or max(category_scores.values()) == 0:
            return 'other', 0.0
        
        best_category = max(category_scores, key=category_scores.get)
        max_score = category_scores[best_category]
        
        # Calculate confidence (normalize to 0-1)
        total_possible_score = len(self.category_patterns[best_category]['keywords']) + len(self.category_patterns[best_category]['patterns']) * 2
        confidence = min(max_score / total_possible_score, 1.0)
        
        return best_category, confidence
    
    def detect_duplicates(self, new_description: str, existing_complaints: List[Dict]) -> List[Dict]:
        """
        Detect potential duplicate complaints
        Returns list of potential duplicates with similarity scores
        """
        duplicates = []
        new_desc_lower = new_description.lower()
        
        for complaint in existing_complaints:
            existing_desc_lower = complaint.get('description', '').lower()
            
            # Simple similarity check using common words
            new_words = set(new_desc_lower.split())
            existing_words = set(existing_desc_lower.split())
            
            if len(new_words) == 0 or len(existing_words) == 0:
                continue
            
            # Calculate Jaccard similarity
            intersection = len(new_words.intersection(existing_words))
            union = len(new_words.union(existing_words))
            similarity = intersection / union if union > 0 else 0
            
            # Consider it a potential duplicate if similarity > 0.3
            if similarity > 0.3:
                duplicates.append({
                    'complaint_id': complaint.get('complaint_id'),
                    'similarity': similarity,
                    'description': complaint.get('description')
                })
        
        # Sort by similarity (highest first)
        duplicates.sort(key=lambda x: x['similarity'], reverse=True)
        return duplicates
    
    def calculate_danger_score(self, description: str, category: str) -> float:
        """
        Calculate danger/urgency score for a complaint
        Returns score between 0-1 (1 being most urgent)
        """
        description_lower = description.lower()
        danger_keywords = [
            'emergency', 'urgent', 'dangerous', 'hazard', 'accident', 'injury',
            'fire', 'flood', 'collapse', 'broken', 'sharp', 'exposed', 'live wire',
            'gas leak', 'sewage', 'contamination', 'blocking', 'traffic jam'
        ]
        
        urgency_score = 0
        
        # Check for danger keywords
        for keyword in danger_keywords:
            if keyword in description_lower:
                urgency_score += 0.1
        
        # Category-based urgency
        category_urgency = {
            'electric': 0.3,  # Electrical issues are generally more urgent
            'water': 0.2,     # Water issues can be urgent
            'roads': 0.1,     # Road issues are moderately urgent
            'sanitation': 0.05, # Sanitation issues are less urgent
            'parks': 0.02,    # Park issues are least urgent
            'traffic': 0.15,  # Traffic issues are moderately urgent
            'other': 0.05
        }
        
        urgency_score += category_urgency.get(category, 0.05)
        
        # Cap at 1.0
        return min(urgency_score, 1.0)

def main():
    """Test the categorization system"""
    categorizer = ComplaintCategorizer()
    
    test_complaints = [
        "Large pothole on main road causing vehicle damage",
        "Garbage not collected for 3 days, creating bad smell",
        "Street light not working at night, very dark",
        "Water supply interrupted for 2 days",
        "Tree fallen in park, blocking pathway",
        "Traffic signal not working, causing congestion"
    ]
    
    print("Testing JANMITRA AI Categorization System")
    print("=" * 50)
    
    for complaint in test_complaints:
        category, confidence = categorizer.categorize(complaint)
        danger_score = categorizer.calculate_danger_score(complaint, category)
        
        print(f"Complaint: {complaint}")
        print(f"Category: {category} (confidence: {confidence:.2f})")
        print(f"Danger Score: {danger_score:.2f}")
        print("-" * 30)

if __name__ == "__main__":
    main()
