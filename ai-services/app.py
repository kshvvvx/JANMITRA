#!/usr/bin/env python3
"""
JANMITRA AI Services - Flask API
Provides AI endpoints for complaint categorization, duplicate detection, and danger scoring
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from categorization import ComplaintCategorizer
import json

app = Flask(__name__)
CORS(app)

# Initialize the categorizer
categorizer = ComplaintCategorizer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'janmitra-ai-services',
        'version': '1.0.0'
    })

@app.route('/categorize', methods=['POST'])
def categorize_complaint():
    """Categorize a complaint description"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400
        
        description = data['description']
        category, confidence = categorizer.categorize(description)
        
        return jsonify({
            'category': category,
            'confidence': confidence,
            'description': description
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-duplicates', methods=['POST'])
def detect_duplicates():
    """Detect potential duplicate complaints"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data or 'existing_complaints' not in data:
            return jsonify({'error': 'Description and existing_complaints are required'}), 400
        
        description = data['description']
        existing_complaints = data['existing_complaints']
        
        duplicates = categorizer.detect_duplicates(description, existing_complaints)
        
        return jsonify({
            'duplicates': duplicates,
            'count': len(duplicates)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/danger-score', methods=['POST'])
def calculate_danger_score():
    """Calculate danger/urgency score for a complaint"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400
        
        description = data['description']
        category = data.get('category', 'other')
        
        danger_score = categorizer.calculate_danger_score(description, category)
        
        return jsonify({
            'danger_score': danger_score,
            'urgency_level': get_urgency_level(danger_score),
            'description': description,
            'category': category
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_complaint():
    """Complete analysis of a complaint (category, duplicates, danger score)"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400
        
        description = data['description']
        existing_complaints = data.get('existing_complaints', [])
        
        # Get category
        category, confidence = categorizer.categorize(description)
        
        # Detect duplicates
        duplicates = categorizer.detect_duplicates(description, existing_complaints)
        
        # Calculate danger score
        danger_score = categorizer.calculate_danger_score(description, category)
        
        return jsonify({
            'category': category,
            'confidence': confidence,
            'danger_score': danger_score,
            'urgency_level': get_urgency_level(danger_score),
            'duplicates': duplicates,
            'duplicate_count': len(duplicates),
            'description': description
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_urgency_level(danger_score: float) -> str:
    """Convert danger score to urgency level"""
    if danger_score >= 0.7:
        return 'high'
    elif danger_score >= 0.4:
        return 'medium'
    else:
        return 'low'

if __name__ == '__main__':
    print("Starting JANMITRA AI Services...")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /categorize - Categorize complaint")
    print("  POST /detect-duplicates - Detect duplicate complaints")
    print("  POST /danger-score - Calculate danger score")
    print("  POST /analyze - Complete complaint analysis")
    
    app.run(debug=False, host='0.0.0.0', port=5001)
